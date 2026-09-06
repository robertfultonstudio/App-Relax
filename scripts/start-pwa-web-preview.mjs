import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPwaPreviewHandler } from "./pwa-preview-server.mjs";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2).filter((arg) => arg !== "--");
let port = 8095;
let checkOnly = false;

try {
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--check") checkOnly = true;
    else if (argument === "--port" || argument.startsWith("--port=")) {
      const value = argument === "--port" ? args[++index] : argument.slice(7);
      port = /^\d+$/.test(value ?? "") ? Number(value) : NaN;
    } else
      throw new Error(
        `Opzione non supportata: ${argument}. Usa soltanto --port o --check.`,
      );
  }
  if (!Number.isSafeInteger(port) || port < 1024 || port > 65535)
    throw new Error("La porta deve essere compresa fra 1024 e 65535.");
  const preview = createPwaPreviewHandler({
    artifactRoot: join(projectRoot, "dist", "m5-pwa"),
    audioCatalogRoot: join(projectRoot, "public", "audio-catalog"),
    manifestPath: join(projectRoot, "docs", "M4_LOCAL_LISTENING_MANIFEST.json"),
    port,
  });
  console.log(
    `Catalogo locale pronto: ${preview.audioCount} file, ${preview.audioBytes} byte; lettura su richiesta.`,
  );
  if (checkOnly)
    console.log(
      "PWA local preflight: PASS (export e catalogo presenti; nessun server avviato).",
    );
  else {
    const server = createServer(preview.handler);
    server.once("error", (error) => {
      console.error(
        error.code === "EADDRINUSE"
          ? `La porta ${port} è già occupata. Chiudi la precedente anteprima o usa --port 8096.`
          : `Avvio PWA bloccato (${error.code ?? "errore"}): ${error.message}`,
      );
      process.exitCode = 1;
    });
    server.listen(port, "127.0.0.1", () => {
      console.log(`PWA pronta: http://localhost:${port}/`);
      console.log(
        "Apri questo indirizzo nel browser Codex. Per spegnere: Ctrl+C in questa finestra.",
      );
      console.log(
        "Server statico leggero: nessun Metro, nessuna copia audio, accesso solo da questo Mac.",
      );
    });
    let stopping = false;
    for (const signal of ["SIGINT", "SIGTERM"]) {
      process.on(signal, () => {
        if (stopping) return;
        stopping = true;
        server.close(() => console.log("PWA spenta."));
        server.closeAllConnections();
      });
    }
  }
} catch (error) {
  console.error(`PWA non avviata: ${error.message}`);
  process.exitCode = 1;
}
