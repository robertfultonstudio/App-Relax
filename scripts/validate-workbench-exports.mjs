import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(`QA export boundary failed: ${message}`);
}

function readableFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return readableFiles(path);
    return [".js", ".html", ".json"].includes(extname(path)) ? [path] : [];
  });
}

function joinedText(directory) {
  const files = readableFiles(directory);
  return {
    files,
    text: files.map((path) => readFileSync(path, "utf8")).join("\n"),
  };
}

const consumerDirectory = resolve(process.argv[2] ?? "dist/m5-web-consumer");
const qaDirectory = resolve(process.argv[3] ?? "dist/m5-web-qa");
assert(
  existsSync(consumerDirectory),
  `missing consumer export ${consumerDirectory}`,
);
assert(existsSync(qaDirectory), `missing QA export ${qaDirectory}`);

const consumer = joinedText(consumerDirectory);
const qa = joinedText(qaDirectory);
for (const forbidden of [
  "AUDIO QA WORKBENCH · DEVELOPMENT ONLY",
  "@app-relax/qa-workbench-draft",
  "qa-workbench",
]) {
  assert(
    !consumer.text.includes(forbidden),
    `consumer export contains ${forbidden}`,
  );
}
assert(
  qa.text.includes("AUDIO QA WORKBENCH · DEVELOPMENT ONLY"),
  "QA export does not contain the Workbench sentinel",
);
assert(
  qa.text.includes("@app-relax/qa-workbench-draft"),
  "QA export does not contain its isolated draft key",
);

console.log(
  `QA export boundary: PASS (${consumer.files.length} consumer text artifacts clean; ${qa.files.length} QA text artifacts contain the sentinel).`,
);
