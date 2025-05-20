#!/bin/bash
# build-wasm.sh - Script to build WASM and ensure it's available in multiple locations

echo "Building WASM module and copying to public folder..."

# Step 1: Build the WASM using wasm-pack
cd crate
wasm-pack build --target web
cd ..

# Step 2: Create the public/wasm directory if it doesn't exist
mkdir -p public/wasm

# Step 3: Copy the WASM file to the public folder
cp crate/pkg/rl_wasm_bg.wasm public/wasm/

# Step 4: Make a note of the WASM file location
echo "WASM file location: $(pwd)/public/wasm/rl_wasm_bg.wasm"

# Step 5: List the files in the public/wasm directory
echo "Files in public/wasm directory:"
ls -la public/wasm/

echo "WASM build complete!"