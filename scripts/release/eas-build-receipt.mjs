#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

const [input, output] = process.argv.slice(2);
if (!input || !output)
  throw new Error("Usage: eas-build-receipt.mjs INPUT OUTPUT");
const metadata = JSON.parse(readFileSync(input, "utf8"));
const { artifactUrl: _privateDownloadUrl, ...receipt } = metadata;
writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`Public EAS receipt PASS: ${receipt.platform} ${receipt.id}`);
