import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const args = process.argv.slice(2).filter(arg => arg !== "--");
const child = spawn(process.execPath, [nextBin, "dev", ...args], {
  stdio: "inherit"
});

child.on("exit", code => {
  process.exit(code ?? 1);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
