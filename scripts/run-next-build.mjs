import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const nextBin = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const wasmDir = resolve(process.cwd(), "node_modules", "@next", "swc-wasm-nodejs");
const shouldUseWasmFallback =
  process.platform === "darwin" &&
  process.arch === "arm64" &&
  existsSync(resolve(wasmDir, "wasm.js"));

const env = {
  ...process.env
};

if (shouldUseWasmFallback) {
  env.NEXT_TEST_WASM = "1";
  env.NEXT_TEST_WASM_DIR = wasmDir;
}

const child = spawn(process.execPath, [nextBin, "build", "--webpack"], {
  stdio: "inherit",
  env
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
