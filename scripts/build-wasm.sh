#!/bin/bash
set -e

echo "Building Rust WASM core..."
cd veritas-core

# Build with wasm-pack
wasm-pack build --target web --out-dir ../extension/src/wasm

echo "WASM build complete!"
