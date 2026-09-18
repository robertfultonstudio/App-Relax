import catalog from './catalog.json' with { type: 'json' };

export const PART_SIZE = 64 * 1024 * 1024;
const files = new Map([...catalog.files, ...(catalog.alternateFiles ?? [])].map(f => [f.filename, f]));
const importFiles = new Map((catalog.importFiles ?? catalog.files).map(f => [f.filename, f]));
const keyFor = f => `approved/${f.sha256}`;
const importKeyFor = f => `imports/flac-${f.sha256}`;
const mime = f => f.filename.endsWith('.flac') ? 'audio/flac' : 'audio/wav';
const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
const error = (message, status) => json({ error: message }, status);
const valid = (obj, f) => obj && obj.size === f.bytes && obj.customMetadata?.sha256 === f.sha256;

export function byteRange(value, size) {
  if (!value) return null;
  const m = /^bytes=(\d*)-(\d*)$/i.exec(value.trim());
  if (!m || (!m[1] && !m[2])) return false;
  const a = m[1] ? Number(m[1]) : null, b = m[2] ? Number(m[2]) : null;
  if ([a, b].some(n => n !== null && !Number.isSafeInteger(n))) return false;
  if (a === null) return b > 0 ? { offset: Math.max(0, size - b), length: Math.min(b, size) } : false;
  if (a >= size || (b !== null && b < a)) return false;
  return { offset: a, length: Math.min(b ?? size - 1, size - 1) - a + 1 };
}

async function importAllowed(request, env, cleanupOnly = false) {
  const expiry = Number(env.IMPORT_EXPIRES_AT);
  if (!env.SITE_IMPORT_KEY || (!cleanupOnly && (!Number.isFinite(expiry) || Date.now() >= expiry))) return false;
  const received = request.headers.get('X-Review-Import-Key') ?? '';
  const bytes = s => new TextEncoder().encode(s);
  const [a, b] = await Promise.all([received, env.SITE_IMPORT_KEY].map(s => crypto.subtle.digest('SHA-256', bytes(s))));
  const aa = new Uint8Array(a), bb = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

async function cleanupImport(env, f) {
  const record = await env.AUDIO.get(importKeyFor(f));
  if (!record) return;
  const rec = await record.json();
  if (rec.file !== f.filename || rec.key !== `pending/${f.sha256}/${rec.session}` || !rec.uploadId) throw new Error('Import reservation requires manual recovery; no additional upload allowed.');
  // A completed temporary object no longer has an abortable multipart upload.
  if (!(await env.AUDIO.head(rec.key))) await env.AUDIO.resumeMultipartUpload(rec.key, rec.uploadId).abort();
  await env.AUDIO.delete([rec.key, importKeyFor(f)]);
}

async function serveAudio(request, env, f) {
  const meta = await env.AUDIO.head(keyFor(f));
  if (!valid(meta, f)) return error('This recording is not ready for listening yet.', 503);
  const headers = new Headers({
    'Content-Type': mime(f), 'Content-Length': String(f.bytes),
    'Accept-Ranges': 'bytes', 'ETag': meta.httpEtag,
    'X-Content-SHA256': f.sha256, 'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-store',
  });
  if (request.method === 'HEAD') return new Response(null, { headers });
  const ifRange = request.headers.get('If-Range');
  const range = byteRange(!ifRange || ifRange === meta.httpEtag ? request.headers.get('Range') : null, f.bytes);
  if (range === false) {
    headers.set('Content-Range', `bytes */${f.bytes}`);
    headers.delete('Content-Length');
    return new Response(null, { status: 416, headers });
  }
  const obj = await env.AUDIO.get(keyFor(f), range ? { range } : undefined);
  if (!valid(obj, f) || !obj.body) return error('Recording unavailable.', 503);
  if (range) {
    headers.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${f.bytes}`);
    headers.set('Content-Length', String(range.length));
  }
  return new Response(obj.body, { status: range ? 206 : 200, headers });
}

async function importAudio(request, env, url) {
  const cleanupOnly = url.searchParams.get('action') === 'cleanup' && request.method === 'DELETE';
  if (!(await importAllowed(request, env, cleanupOnly))) return error('Import is closed.', 403);
  if (cleanupOnly) {
    for (const f of importFiles.values()) await cleanupImport(env, f);
    return json({ pending: 0 });
  }
  if (url.searchParams.get('action') === 'publish' && request.method === 'POST') {
    const publishFiles = catalog.publishFiles ?? catalog.files;
    for (const entry of publishFiles) {
      if (!valid(await env.AUDIO.head(keyFor(entry)), entry)) return error('Catalog is incomplete.', 409);
    }
    for (const f of importFiles.values()) await cleanupImport(env, f);
    await env.AUDIO.put(catalog.publishReadyKey ?? 'review-ready', publishFiles.map(f => f.sha256).join('\n'));
    return json({ ready: true, fileCount: catalog.fileCount });
  }
  const f = importFiles.get(url.searchParams.get('file'));
  if (!f) return error('Recording is not in the approved manifest.', 404);
  const action = url.searchParams.get('action');
  const existing = await env.AUDIO.head(keyFor(f));
  if (existing && !valid(existing, f)) return error('Existing object failed validation; manual review required.', 409);
  if (valid(existing, f) && (action === 'put' || action === 'create')) {
    await cleanupImport(env, f);
    return json({ alreadyVerified: true, sha256: f.sha256 });
  }
  const options = { sha256: f.sha256, onlyIf: new Headers({ 'If-None-Match': '*' }),
    httpMetadata: { contentType: mime(f) }, customMetadata: { sha256: f.sha256 } };
  if (action === 'put' && request.method === 'PUT') {
    if (f.bytes > PART_SIZE || Number(request.headers.get('Content-Length')) !== f.bytes || !request.body) return error('Invalid single upload size.', 400);
    await env.AUDIO.put(keyFor(f), request.body, options);
    if (!valid(await env.AUDIO.head(keyFor(f)), f)) return error('Integrity verification failed.', 409);
    return json({ verified: true, sha256: f.sha256 });
  }
  if (action === 'create' && request.method === 'POST') {
    const session = crypto.randomUUID(), temp = `pending/${f.sha256}/${session}`;
    // Reserve before creating an upload. Concurrent/retried creates cannot leak
    // unbounded sessions. An uncertain reservation fails closed for recovery.
    const old = await env.AUDIO.get(importKeyFor(f));
    if (old) {
      const rec = await old.json();
      if (rec.file !== f.filename || !rec.uploadId) return error('Import reservation needs recovery.', 409);
      return json({ session: rec.session, partSize: PART_SIZE, resumed: true });
    }
    const reservation = { file: f.filename, key: temp, session };
    const reserved = await env.AUDIO.put(importKeyFor(f), JSON.stringify(reservation), { onlyIf: new Headers({ 'If-None-Match': '*' }) });
    if (!reserved) return error('Import is already reserved. Retry without creating another upload.', 409);
    const upload = await env.AUDIO.createMultipartUpload(temp);
    await env.AUDIO.put(importKeyFor(f), JSON.stringify({ ...reservation, uploadId: upload.uploadId }));
    return json({ session, partSize: PART_SIZE });
  }
  const session = url.searchParams.get('session');
  if (!/^[0-9a-f-]{36}$/.test(session ?? '')) return error('Invalid import session.', 400);
  const record = await env.AUDIO.get(importKeyFor(f));
  if (!record) return error('Import session not found.', 404);
  const rec = await record.json();
  if (rec.file !== f.filename || rec.key !== `pending/${f.sha256}/${session}`) return error('Import scope mismatch.', 403);
  const upload = env.AUDIO.resumeMultipartUpload(rec.key, rec.uploadId);
  if (action === 'part' && request.method === 'PUT') {
    const part = Number(url.searchParams.get('part'));
    const expected = Math.min(PART_SIZE, f.bytes - (part - 1) * PART_SIZE);
    if (!Number.isInteger(part) || part < 1 || expected <= 0 || Number(request.headers.get('Content-Length')) !== expected || !request.body) return error('Invalid part.', 400);
    return json(await upload.uploadPart(part, request.body));
  }
  if (action === 'complete' && request.method === 'POST') {
    if (Number(request.headers.get('Content-Length')) > 16384) return error('Manifest too large.', 413);
    const parts = await request.json();
    if (!Array.isArray(parts) || parts.length !== Math.ceil(f.bytes / PART_SIZE) || parts.some((p, i) => p.partNumber !== i + 1 || typeof p.etag !== 'string')) return error('Incomplete part list.', 400);
    await upload.complete(parts);
    const temp = await env.AUDIO.get(rec.key);
    if (!temp?.body || temp.size !== f.bytes) return error('Assembled length mismatch.', 409);
    // R2 verifies the full SHA-256 while streaming; metadata alone is not proof.
    await env.AUDIO.put(keyFor(f), temp.body, options);
    if (!valid(await env.AUDIO.head(keyFor(f)), f)) return error('Final integrity failed.', 409);
    await cleanupImport(env, f);
    return json({ verified: true, sha256: f.sha256 });
  }
  if (action === 'abort' && request.method === 'DELETE') {
    await cleanupImport(env, f);
    return json({ aborted: true });
  }
  return error('Method not allowed.', 405);
}

export function createWorker(importsEnabled = catalog.phase === 'stage') {
return {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      // Sites dispatch owns sign-in/access. No app account, cookie, or OAuth stack.
      const cleanupOnly = url.pathname === '/_review/import' && url.searchParams.get('action') === 'cleanup' && request.method === 'DELETE';
      const admin = importsEnabled && await importAllowed(request, env, cleanupOnly);
      if (!request.headers.get('oai-authenticated-user-id') && !admin) return error('Private review. Sign in with the authorized ChatGPT account.', 401);
      if (url.pathname === '/_review/import') return importsEnabled ? await importAudio(request, env, url) : error('Import is closed in the active review.', 403);
      if (!['GET', 'HEAD'].includes(request.method)) return error('Method not allowed.', 405);
      if (url.pathname === '/_review/catalog') {
        const results = [];
        for (const f of catalog.files) results.push({ filename: f.filename, bytes: f.bytes, sha256: f.sha256, ready: valid(await env.AUDIO.head(keyFor(f)), f) });
        return json({ files: results, fileCount: results.length, totalBytes: catalog.totalBytes });
      }
      if (url.pathname.startsWith('/audio-catalog/')) {
        const f = files.get(decodeURIComponent(url.pathname.slice('/audio-catalog/'.length)));
        return f ? await serveAudio(request, env, f) : error('Recording not found.', 404);
      }
      if (!env.ASSETS) return error('Interface unavailable.', 503);
      const ready = await env.AUDIO.get(catalog.readyKey ?? 'review-ready');
      if (!ready || await ready.text() !== catalog.files.map(f => f.sha256).join('\n')) return error('Private listening review is being prepared. Please return when your review link is confirmed.', 503);
      if (url.pathname === '/') url.pathname = '/index.html';
      else if (!/\.[a-z0-9]+$/i.test(url.pathname)) url.pathname = url.pathname.replace(/\/$/, '') + '.html';
      return await env.ASSETS.fetch(new Request(url, request));
    } catch (e) {
      console.error('Private review request failed:', String(e.message).slice(0, 180));
      return error('The request could not be completed safely. Please retry.', 502);
    }
  },
};
}
export default createWorker();
