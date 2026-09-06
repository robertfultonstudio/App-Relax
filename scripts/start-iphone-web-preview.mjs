import { execFileSync, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const expoCli = join(projectRoot, "node_modules", "expo", "bin", "cli");
const port = "8094";
const argumentsSet = new Set(process.argv.slice(2));
const reviewMode = argumentsSet.delete("--review");
if (argumentsSet.size > 0) {
  throw new Error(
    `Unknown iPhone preview option: ${[...argumentsSet].join(", ")}.`,
  );
}
const surface = reviewMode ? "qa" : "consumer";
const initialPath = reviewMode ? "/qa-workbench" : "/";

function command(path, args) {
  return execFileSync(path, args, { encoding: "utf8" }).trim();
}

function privateIpv4(address) {
  const octets = address.split(".").map(Number);
  return (
    octets.length === 4 &&
    octets.every(
      (octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255,
    ) &&
    (octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168))
  );
}

const route = command("/sbin/route", ["-n", "get", "default"]);
const interfaceMatch = route.match(/^\s*interface:\s+(\S+)\s*$/m);
if (!interfaceMatch) {
  throw new Error("Could not determine the default network interface.");
}

const address = command("/usr/sbin/ipconfig", ["getifaddr", interfaceMatch[1]]);
if (!privateIpv4(address)) {
  throw new Error(
    `Refusing to expose the preview on non-private address ${address}.`,
  );
}

const url = `http://${address}:${port}${initialPath}`;
process.stdout.write(
  `\nApp Relax iPhone ${reviewMode ? "Review" : "preview"}: ${url}\n`,
);
process.stdout.write(
  "Use only on a trusted Wi-Fi network. Press Ctrl-C when the test is finished.\n\n",
);

const child = spawn(
  process.execPath,
  [expoCli, "start", "--web", "--lan", "--port", port],
  {
    cwd: projectRoot,
    env: {
      ...process.env,
      APP_RELAX_SURFACE: surface,
      BROWSER: "none",
      EXPO_PUBLIC_APP_RELAX_LAN_PREVIEW_HOST: address,
      EXPO_PUBLIC_FOLDER: "public",
    },
    stdio: "inherit",
  },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (child.exitCode === null && child.signalCode === null)
      child.kill(signal);
  });
}

child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 0 : 1);
});

child.on("error", (error) => {
  process.stderr.write(
    `Could not start the iPhone preview: ${error.message}\n`,
  );
  process.exitCode = 1;
});
