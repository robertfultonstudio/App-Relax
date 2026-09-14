// Local-only real Web Audio render audit. No audio output, upload or master edits.
import { createServer } from "node:http";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const port = 8250;
const source = ts.transpileModule(
  readFileSync("src/audio/web/ClockedWavSource.ts", "utf8"),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  },
).outputText;
const html = `<!doctype html><meta charset="utf-8"><title>Local audio continuity audit</title>
<style>body{font:18px system-ui;max-width:760px;padding:24px;background:#f6f1e8;color:#172320}button{padding:16px;font:inherit}pre{white-space:pre-wrap}</style>
<h1>Offline audio continuity audit</h1><p>No speaker output. Compares the real browser rendering of identical PCM samples.</p>
<button id="run">Run continuity checks</button><pre id="result">Ready</pre>
<script type="module">
import {ClockedWavSource, decodePcm24} from '/source.js';
function fixture(frames, kind) {
  const bytes = new Uint8Array(44 + frames * 6), v = new DataView(bytes.buffer);
  const word = (at, s) => [...s].forEach((c,i) => bytes[at+i] = c.charCodeAt(0));
  word(0,'RIFF'); v.setUint32(4,bytes.length-8,true); word(8,'WAVE'); word(12,'fmt ');
  v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,2,true);
  v.setUint32(24,48000,true); v.setUint32(28,288000,true); v.setUint16(32,6,true); v.setUint16(34,24,true);
  word(36,'data'); v.setUint32(40,frames*6,true);
  for(let i=0;i<frames;i++) for(let c=0;c<2;c++) {
    const sample = kind === 'constant' ? 0.2 : 0.25*Math.sin(2*Math.PI*101*i/frames+c*0.2)+0.04*Math.sin(2*Math.PI*15037*i/frames);
    const n = Math.round(sample*8388608), p=44+i*6+c*3;
    bytes[p]=n&255; bytes[p+1]=(n>>8)&255; bytes[p+2]=(n>>16)&255;
  }
  return bytes;
}
async function runOne(rate, frames, kind) {
  const data=fixture(frames,kind), requests=[];
  const context = new OfflineAudioContext(2,48000*12,48000);
  const source = new ClockedWavSource(context, async (_url, init) => {
    const [start,end]=init.headers.Range.match(/[0-9]+/g).map(Number);
    requests.push([start,end]);
    return new Response(data.slice(start,end+1),{status:206,headers:{'content-range':'bytes '+start+'-'+end+'/'+data.length}});
  });
  source.src='fixture.wav'; source.output.connect(context.destination);
  await source.play();
  // Fill is intentionally async. No rendering clock progresses until startRendering.
  await new Promise(resolve=>setTimeout(resolve,50));
  const rendered = await context.startRendering(); source.pause();
  const referenceContext = new OfflineAudioContext(2,48000*12,48000);
  const samples=decodePcm24(data.subarray(44));
  const buffer=referenceContext.createBuffer(2,frames,48000);
  buffer.copyToChannel(samples[0],0);buffer.copyToChannel(samples[1],1);
  const referenceSource=referenceContext.createBufferSource();
  referenceSource.buffer=buffer;referenceSource.loop=true;
  referenceSource.connect(referenceContext.destination);referenceSource.start(0.06);
  const reference=await referenceContext.startRendering();
  // Device conversion happens once, after the continuous 48 kHz mix.
  async function outputAt(buffer) {
    if(rate===48000) return buffer;
    const output=new OfflineAudioContext(2,rate*12,rate), node=output.createBufferSource();
    node.buffer=buffer;node.connect(output.destination);node.start();
    return output.startRendering();
  }
  const actual=await outputAt(rendered), expected=await outputAt(reference);
  let maxError=0, squared=0, worstFrame=0, above=0;
  for(let c=0;c<2;c++) {
    const a=actual.getChannelData(c), b=expected.getChannelData(c);
    for(let i=Math.ceil(rate*0.06)+64;i<a.length;i++) {
      const error=Math.abs(a[i]-b[i]); squared+=error*error;
      if(error>maxError){maxError=error;worstFrame=i;}
      if(error>0.00001) above++;
    }
  }
  return {rate,frames,kind,maxError,errorDbfs:20*Math.log10(maxError||1e-20),rmsError:Math.sqrt(squared/(rate*24)),worstTime:worstFrame/rate,samplesAbove1e5:above,requests:requests.length,pass:maxError<0.00001};
}
document.getElementById('run').onclick=async()=>{
  const button=document.getElementById('run'), output=document.getElementById('result');
  button.disabled=true;const results=[];
  try {
    for(const rate of [48000,44100]) for(const kind of ['constant','tones']) for(const frames of [150000,150001]) {
      output.textContent='Rendering '+rate+' Hz / '+kind+' / '+frames+' frames';
      results.push(await runOne(rate,frames,kind));
    }
    const report={kind:'48 kHz window clock then continuous output resampling: real browser OfflineAudioContext, not iPhone listening approval',pass:results.every(r=>r.pass),results};
    output.textContent=JSON.stringify(report,null,2);
    const response=await fetch('/result',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(report)});
    if(!response.ok) throw Error('Could not save local report');
  } catch(error) {output.textContent='FAILED: '+error.message;} finally {button.disabled=false;}
};
</script>`;
const server = createServer(async (request, response) => {
  if (
    !["localhost:" + port, "127.0.0.1:" + port].includes(request.headers.host)
  ) {
    response.writeHead(403).end();
    return;
  }
  if (request.method === "GET" && request.url === "/") {
    response
      .writeHead(200, {
        "content-type": "text/html",
        "cache-control": "no-store",
      })
      .end(html);
  } else if (request.method === "GET" && request.url === "/source.js") {
    response
      .writeHead(200, {
        "content-type": "text/javascript",
        "cache-control": "no-store",
      })
      .end(source);
  } else if (
    request.method === "POST" &&
    request.url === "/result" &&
    request.headers.origin === "http://localhost:" + port
  ) {
    let text = "";
    for await (const chunk of request) {
      text += chunk;
      if (text.length > 16000) {
        response.writeHead(413).end();
        return;
      }
    }
    const result = JSON.parse(text);
    mkdirSync("dist/audio-continuity-audit", { recursive: true });
    writeFileSync(
      "dist/audio-continuity-audit/browser-render.json",
      JSON.stringify(result, null, 2) + "\n",
    );
    console.log(
      "Render audit:",
      result.pass ? "PASS" : "FAIL",
      resolve("dist/audio-continuity-audit/browser-render.json"),
    );
    response.writeHead(200).end("Saved");
  } else response.writeHead(404).end();
});
server.listen(port, "127.0.0.1", () =>
  console.log("Local silent render audit: http://localhost:" + port),
);
process.on("SIGTERM", () => {
  server.close();
  server.closeAllConnections();
});
process.on("SIGINT", () => {
  server.close();
  server.closeAllConnections();
});
