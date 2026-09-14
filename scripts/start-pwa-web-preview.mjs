import { createServer } from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCurrentPwaPreview } from "./current-pwa-preview.mjs";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2).filter((arg) => arg !== "--");
let port = 8095;
let checkOnly = false;
let losslessRoot;
let artifactRoot = join(projectRoot, "dist", "m5-pwa");

try {
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--check") checkOnly = true;
    else if (argument === "--port" || argument.startsWith("--port=")) {
      const value = argument === "--port" ? args[++index] : argument.slice(7);
      port = /^\d+$/.test(value ?? "") ? Number(value) : NaN;
    } else if (argument === "--lossless-root" || argument === "--artifact") {
      const value = args[++index];
      if (!value || value.startsWith("--"))
        throw new Error(`Manca il percorso per ${argument}.`);
      if (argument === "--lossless-root") losslessRoot = resolve(value);
      else artifactRoot = resolve(value);
    } else
      throw new Error(
        `Opzione non supportata: ${argument}. Usa --port, --check, --artifact o --lossless-root.`,
      );
  }
  if (!Number.isSafeInteger(port) || port < 1024 || port > 65535)
    throw new Error("La porta deve essere compresa fra 1024 e 65535.");
  const preview = createCurrentPwaPreview({
    projectRoot,
    artifactRoot,
    losslessRoot,
    port,
  });
  console.log(
    `Catalogo review locale: ${preview.reviewAudioCount} file, ${preview.reviewAudioBytes} byte; lettura su richiesta. ${preview.audioCount - preview.reviewAudioCount} URL precedenti conservati per compatibilità offline.`,
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
  if (error.code === "ENOENT" && !losslessRoot)
    console.error(
      "Indica la cartella dei FLAC già esistenti con --lossless-root. Nessun audio viene copiato o generato.",
    );
  process.exitCode = 1;
}
