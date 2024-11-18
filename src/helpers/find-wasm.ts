import { existsSync, readdirSync } from "fs";

export const findWasmPath = (cargoTomlPath: string): string | undefined => {
  // /target/wasm32-unknown-unknown/release/*.wasm
  const absolutePath = cargoTomlPath.replace("Cargo.toml", "");
  const parentWasmDirectory = cargoTomlPath.replace(
    "Cargo.toml",
    "target/wasm32-unknown-unknown/release",
  );
  if (existsSync(parentWasmDirectory)) {
    const wasmFiles = readdirSync(parentWasmDirectory).filter((file) =>
      file.endsWith(".wasm"),
    );
    if (wasmFiles.length === 1) {
      return `${parentWasmDirectory}/${wasmFiles[0]}`;
    }
  }
};
