// Regenerates lib/abi.ts from Foundry artifacts. Run `cd contracts && forge build` first.
import fs from "node:fs";
const f = JSON.parse(fs.readFileSync("contracts/out/TuturFactory.sol/TuturFactory.json", "utf8"));
const t = JSON.parse(fs.readFileSync("contracts/out/TuturFactory.sol/TuturTask.json", "utf8"));
const out =
  "// Generated from contracts/out via `npm run abi`. ABI only; no secrets.\n" +
  `export const factoryAbi = ${JSON.stringify(f.abi, null, 2)} as const;\n\n` +
  `export const taskAbi = ${JSON.stringify(t.abi, null, 2)} as const;\n`;
fs.writeFileSync("lib/abi.ts", out);
console.log("lib/abi.ts written");
