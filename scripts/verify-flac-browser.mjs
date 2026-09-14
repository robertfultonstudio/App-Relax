// Local-only browser decoder gate; does not modify or publish the PWA/audio.
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import {
  createReadStream,
  readFileSync,
  writeFileSync,
  statSync,
  existsSync,
  realpathSync,
} from "node:fs";
import { resolve, join, dirname } from "node:path";
import ts from "typescript";
const [modules, derivatives, reportTag = ""] = process.argv.slice(2);
assert(/^[a-z0-9-]{0,32}$/.test(reportTag), "Invalid diagnostic report tag");
assert(
  modules && derivatives,
  "Expected isolated node_modules and derived FLAC folder",
);
const root = process.cwd(),
  reportDir = join(root, "dist/flac-window-spike"),
  port = 8252;
// Resolve transitive packages through their actual dependency owner. pnpm's
// isolated layout need not expose common/codec-parser at the workspace root.
const flacRequire = createRequire(
  realpathSync(join(resolve(modules), "@wasm-audio-decoders/flac/index.js")),
);
const commonRequire = createRequire(
  flacRequire.resolve("@wasm-audio-decoders/common"),
);
const moduleRoots = new Map();
for (const name of [
  "@wasm-audio-decoders/flac",
  "@wasm-audio-decoders/common",
  "codec-parser",
  "@eshaz/web-worker",
  "simple-yenc",
]) {
  let folder = dirname(
    (name === "@eshaz/web-worker" || name === "simple-yenc"
      ? commonRequire
      : flacRequire
    ).resolve(name),
  );
  while (
    !existsSync(join(folder, "package.json")) ||
    JSON.parse(readFileSync(join(folder, "package.json"))).name !== name
  ) {
    const parent = dirname(folder);
    assert.notEqual(parent, folder, "Package root not found");
    folder = parent;
  }
  moduleRoots.set(name, folder);
}
const files = new Map([
  [
    "FIELD_RAIN_005_MISTED_GARDEN_48K24_LOOP.flac",
    join(
      root,
      "public/audio-catalog/FIELD_RAIN_005_MISTED_GARDEN_48K24_LOOP.flac",
    ),
  ],
  [
    "FIELD_SEA_005_PEARL_TIDE_48K24_LOOP.flac",
    join(root, "public/audio-catalog/FIELD_SEA_005_PEARL_TIDE_48K24_LOOP.flac"),
  ],
  [
    "01_soglia_del_respiro_LOOP_48K24.flac",
    join(resolve(derivatives), "01_soglia_del_respiro_LOOP_48K24.flac"),
  ],
]);
const cases = [...files].map(([file, path]) => {
  const index = JSON.parse(readFileSync(join(reportDir, file + ".index.json")));
  const report = JSON.parse(
    readFileSync(join(reportDir, file + ".report.json")),
  );
  assert(report.fullDecodePcmIdentity && statSync(path).size === report.bytes);
  return {
    file,
    bytes: report.bytes,
    windows: report.windows.map((w) => ({
      ...w,
      entries: index.entries.filter(
        (e) => e[0] + e[3] > w.startFrame && e[0] < w.startFrame + w.frames,
      ),
    })),
  };
});
const requests = [];
const sourceModules = new Map(
  [
    ["/clock-source.js", "src/audio/web/ClockedWavSource.ts"],
    ["/flac-reader.js", "src/audio/web/FlacWindowReader.ts"],
  ].map(([url, file]) => [
    url,
    ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    }).outputText,
  ]),
);
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Local FLAC decoder gate</title>
<style>body{font:18px system-ui;max-width:800px;margin:32px auto;padding:16px}button{font:inherit;padding:16px}pre{white-space:pre-wrap}</style>
<h1>Local FLAC decoder gate</h1><p>No audio is played. This tests exact sample recovery in a Web Worker, not iPhone playback or loop scheduling.</p>
<button id="run">Run lossless window test</button><pre id="result">Ready</pre>
<script type="importmap">{"imports":{"@wasm-audio-decoders/common":"/modules/@wasm-audio-decoders/common/index.js","codec-parser":"/modules/codec-parser/index.js","@eshaz/web-worker":"/modules/@eshaz/web-worker/browser.js","simple-yenc":"/modules/simple-yenc/dist/esm.js"}}</script>
<script type="module">
import {FLACDecoderWebWorker} from '/modules/@wasm-audio-decoders/flac/index.js';
const result=document.getElementById('result'), button=document.getElementById('run');
button.onclick=async()=>{button.disabled=true;let decoder;const rows=[];try{
 const fixtures=await(await fetch('/cases.json')).json();
 decoder=new FLACDecoderWebWorker();await decoder.ready;
 for(const item of fixtures) for(const window of item.windows){
  result.textContent='Checking '+item.file+' at frame '+window.startFrame;
  const [lo,hi]=window.range,response=await fetch('/audio/'+encodeURIComponent(item.file),{headers:{Range:'bytes='+lo+'-'+hi}});
  if(response.status!==206||response.headers.get('Content-Range')!=='bytes '+lo+'-'+hi+'/'+item.bytes)throw Error('Invalid bounded Range response');
  const input=new Uint8Array(await response.arrayBuffer());if(input.length!==hi-lo+1)throw Error('Range length mismatch');
  await decoder.reset();const started=performance.now();
  const frames=window.entries.map(e=>input.subarray(e[1]-lo,e[1]-lo+e[2]));
  const out=await decoder.decodeFrames(frames);
  if(!out.errors||!out.channelData)throw Error('Decoder output shape: '+JSON.stringify(out).slice(0,250));
  if(out.errors.length||out.sampleRate!==48000||out.bitDepth!==24||out.channelData.length!==2)throw Error('Decoder format/errors');
  const pcm=new Uint8Array(window.frames*6),skip=window.startFrame-window.entries[0][0];
  for(let i=0;i<window.frames;i++)for(let c=0;c<2;c++){
   const n=Math.round(out.channelData[c][skip+i]*8388607);if(!Number.isInteger(n)||n< -8388608||n>8388607)throw Error('Invalid PCM24');
   const p=i*6+c*3;pcm[p]=n&255;pcm[p+1]=(n>>8)&255;pcm[p+2]=(n>>16)&255;
  }
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',pcm))].map(n=>n.toString(16).padStart(2,'0')).join('');
  if(hash!==window.sha256)throw Error('PCM identity failed');
  rows.push({file:item.file,startFrame:window.startFrame,frames:window.frames,compressedBytes:input.length,workerDecodeAndVerificationMs:performance.now()-started,pcmIdentity:true,sha256:hash});
 }
 const report={status:'PASS',scope:'Browser Web Worker decoder only; not actual app audio or iPhone',timingScope:'Frame slicing, worker decode, PCM reconstruction and hash only; excludes fetch, reset and worker startup',userAgent:navigator.userAgent,tests:rows.length,rows};
 const saved=await fetch('/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});if(!saved.ok)throw Error('Report save failed');
 result.textContent='PASS · '+rows.length+'/'+rows.length+' lossless windows. Web Worker. No full-file browser download. Not an audio listening test.';
}catch(error){result.textContent='FAIL · '+error.message;}finally{if(decoder)await decoder.free();button.disabled=false;}};
</script></html>`;
const server = createServer(async (req, res) => {
  if (!["localhost:8252", "127.0.0.1:8252"].includes(req.headers.host)) {
    res.writeHead(403).end();
    return;
  }
  res.setHeader("Cache-Control", "no-store");
  if (
    req.method === "GET" &&
    (req.url === "/clock" || req.url === "/clock?compiled=1")
  ) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(readFileSync("scripts/flac-clock-gate.html"));
    return;
  }
  if (
    req.method === "GET" &&
    ["/flac-decoder.worker.min.js", "/flac-client.js"].includes(req.url)
  ) {
    res.setHeader("Content-Type", "text/javascript");
    res.end(
      readFileSync(
        req.url === "/flac-client.js"
          ? "dist/flac-worker/client.mjs"
          : "public-pwa/flac-decoder.worker.min.js",
      ),
    );
    return;
  }
  if (req.method === "GET" && sourceModules.has(req.url)) {
    res.setHeader("Content-Type", "text/javascript");
    res.end(sourceModules.get(req.url));
    return;
  }
  if (req.method === "GET" && req.url.startsWith("/index/")) {
    const file = req.url.slice(7);
    if (!files.has(file)) {
      res.writeHead(404).end();
      return;
    }
    res.setHeader("Content-Type", "application/json");
    res.end(readFileSync(join(reportDir, file + ".index.json")));
    return;
  }
  if (
    req.method === "POST" &&
    req.url === "/clock-result" &&
    req.headers.origin === "http://localhost:8252"
  ) {
    try {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        assert(body.length < 20000);
      }
      const report = JSON.parse(body);
      assert.equal(report.status, "PASS");
      assert.equal(report.rows?.length, files.size);
      assert.deepEqual(
        report.rows.map((row) => row.file).sort(),
        [...files.keys()].sort(),
      );
      for (const row of report.rows) {
        assert(
          row.pass &&
            row.framesCompared === 576000 &&
            row.samplesAbove1e7 === 0,
        );
        assert(
          Number.isFinite(row.maxAbsoluteError) &&
            row.maxAbsoluteError >= 0 &&
            row.maxAbsoluteError < 1e-7,
        );
        assert.equal(row.loopAtSeconds, 0.31);
        assert.equal(row.windowJoinAtSeconds, 2.31);
        if (report.compiledWorker) {
          const reuse = row.idleReuse?.rows;
          assert.equal(reuse?.length, 2);
          assert.equal(reuse[0].opens, 3);
          assert.equal(reuse[1].opens, 1);
          assert(reuse.every((item) => item.closes === item.opens));
          assert.deepEqual(reuse[0].reads, reuse[1].reads);
          for (const item of reuse) {
            assert.equal(item.timings.length, 3);
            assert(
              item.timings.every(
                (timing) => Number.isFinite(timing.ms) && timing.ms >= 0,
              ),
            );
          }
        }
      }
      writeFileSync(
        join(
          reportDir,
          `${report.compiledWorker ? "browser-compiled-clock-report" : "browser-clock-report"}${reportTag ? `-${reportTag}` : ""}.json`,
        ),
        JSON.stringify(report, null, 2) + "\n",
      );
      res.writeHead(200).end("PASS");
    } catch {
      res.writeHead(400).end("Invalid clock report");
    }
    return;
  }
  if (req.method === "GET" && req.url === "/") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(html);
    return;
  }
  if (req.method === "GET" && req.url?.startsWith("/modules/")) {
    const relative = decodeURIComponent(req.url.slice(9));
    const match =
      /^(@wasm-audio-decoders\/(flac|common)|codec-parser|@eshaz\/web-worker|simple-yenc)\/(.+\.js)$/.exec(
        relative,
      );
    if (relative.includes("..") || !match) {
      res.writeHead(403).end();
      return;
    }
    res.setHeader("Content-Type", "text/javascript; charset=utf-8");
    const stream = createReadStream(join(moduleRoots.get(match[1]), match[3]));
    stream.on("error", () => res.destroy());
    stream.pipe(res);
    return;
  }
  if (req.method === "GET" && req.url === "/cases.json") {
    requests.length = 0;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(cases));
    return;
  }
  if (req.method === "POST" && req.url === "/result") {
    try {
      let parts = [],
        bytes = 0;
      for await (const b of req) {
        bytes += b.length;
        if (bytes > 65536) throw Error("Body too large");
        parts.push(b);
      }
      const report = JSON.parse(Buffer.concat(parts).toString());
      assert.equal(report.status, "PASS");
      assert.equal(report.tests, 15);
      assert.equal(report.rows?.length, 15);
      assert.equal(requests.length, 15);
      const expected = cases.flatMap((item) =>
        item.windows.map((w) => ({ item, w })),
      );
      for (let i = 0; i < expected.length; i++) {
        const { item, w } = expected[i],
          row = report.rows[i],
          request = requests[i];
        assert.equal(row.file, item.file);
        assert.equal(row.startFrame, w.startFrame);
        assert.equal(row.frames, w.frames);
        assert.equal(row.sha256, w.sha256);
        assert.equal(row.pcmIdentity, true);
        assert.equal(row.compressedBytes, w.compressedBytes);
        assert.equal(request.file, item.file);
        assert.equal(request.lo, w.range[0]);
        assert.equal(request.hi, w.range[1]);
        assert(
          Number.isFinite(row.workerDecodeAndVerificationMs) &&
            row.workerDecodeAndVerificationMs >= 0,
        );
      }
      writeFileSync(
        join(reportDir, "browser-worker-report.json"),
        JSON.stringify({ ...report, requests }, null, 2) + "\n",
      );
      res.end("Saved");
    } catch {
      res.writeHead(400).end();
    }
    return;
  }
  if (req.method === "GET" && req.url?.startsWith("/audio/")) {
    const name = decodeURIComponent(req.url.slice(7)),
      file = files.get(name),
      match = /^bytes=(\d+)-(\d+)$/.exec(req.headers.range ?? "");
    if (!file || !match) {
      res.writeHead(416).end();
      return;
    }
    const lo = Number(match[1]),
      hi = Number(match[2]),
      size = statSync(file).size;
    if (
      !Number.isSafeInteger(lo) ||
      !Number.isSafeInteger(hi) ||
      hi < lo ||
      hi >= size ||
      hi - lo + 1 > 4 * 1024 * 1024
    ) {
      res.writeHead(416).end();
      return;
    }
    requests.push({ file: name, lo, hi, bytes: hi - lo + 1 });
    res.writeHead(206, {
      "Content-Type": "audio/flac",
      "Content-Length": hi - lo + 1,
      "Content-Range": "bytes " + lo + "-" + hi + "/" + size,
    });
    createReadStream(file, { start: lo, end: hi }).pipe(res);
    return;
  }
  res.writeHead(404).end();
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.close();
    server.closeAllConnections();
  });
server.listen(port, "127.0.0.1", () =>
  console.log("Local FLAC gate: http://localhost:" + port + "/"),
);
