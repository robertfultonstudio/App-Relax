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

function allFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? allFiles(path) : [path];
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
const consumerAudio = allFiles(consumerDirectory).filter((path) =>
  /\.(?:wav|flac)$/i.test(path),
);
const qaAudio = allFiles(qaDirectory).filter((path) =>
  /\.(?:wav|flac)$/i.test(path),
);
assert(
  consumerAudio.length === 0,
  `consumer export contains ${consumerAudio.length} audio file(s)`,
);
assert(
  qaAudio.length === 3,
  `QA export must contain exactly three ATP01 fixtures, found ${qaAudio.length}`,
);
for (const forbidden of [
  "./audio-test.tsx",
  "Engine room.",
  "./session/[sessionId].tsx",
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
  qa.text.includes("Engine room."),
  "QA export lost the original Audio Test screen",
);
assert(
  qa.text.includes("@app-relax/qa-workbench-draft"),
  "QA export does not contain its isolated draft key",
);

console.log(
  `QA export boundary: PASS (${consumer.files.length} consumer text artifacts and zero audio clean; ${qa.files.length} QA text artifacts contain the sentinel and ${qaAudio.length} technical audio fixtures).`,
);
