// // Updated worker implementation with absolute path handling

// // Type definition for the WASM module
// type WasmModule = {
//   default: (wasmPath?: string) => Promise<any>;
//   parse: (data: Uint8Array) => any;
// };

// // Initialize as null
// let wasmModule: WasmModule | null = null;

// // Initialize the WASM module with explicit path handling
// async function initWasm(): Promise<boolean> {
//   try {
//     console.log('Worker: Starting WASM initialization...');

//     // Import the JS module
//     const module = await import('../../crate/pkg/rl_wasm');

//     console.log('Worker: JS module imported, initializing...');

//     // Try different path strategies
//     try {
//       // First, try letting webpack handle it automatically
//       await module.default();
//       wasmModule = module as unknown as WasmModule;
//       console.log('Worker: WASM initialized with default path');
//       return true;
//     } catch (error) {
//       console.log('Worker: Default path failed, trying custom paths...', error);

//       // Try with a specific path based on the expected webpack output
//       try {
//         // For Next.js static assets in the WASM directory
//         await module.default('/_next/static/wasm/rl_wasm_bg.wasm');
//         wasmModule = module as unknown as WasmModule;
//         console.log('Worker: WASM initialized with static path');
//         return true;
//       } catch (secondError) {
//         console.log(
//           'Worker: Static path failed, trying public folder...',
//           secondError
//         );

//         // Try with the public folder path (if you've copied it there)
//         try {
//           await module.default('/wasm/rl_wasm_bg.wasm');
//           wasmModule = module as unknown as WasmModule;
//           console.log('Worker: WASM initialized from public folder');
//           return true;
//         } catch (thirdError) {
//           console.error('Worker: All path strategies failed', thirdError);
//           throw new Error('Failed to initialize WASM with any path strategy');
//         }
//       }
//     }
//   } catch (error) {
//     console.error('Worker: Failed to initialize WASM module:', error);
//     return false;
//   }
// }

// // Handler for messages from the main thread
// self.addEventListener('message', async (event) => {
//   const { type, payload } = event.data;
//   console.log(`Worker: Received message type: ${type}`);

//   if (type === 'INIT') {
//     try {
//       // Initialize the WASM module
//       const success = await initWasm();
//       if (success) {
//         self.postMessage({ type: 'INIT_SUCCESS' });
//       } else {
//         throw new Error('WASM initialization failed');
//       }
//     } catch (error) {
//       console.error('Worker: Init error:', error);
//       self.postMessage({
//         type: 'INIT_ERROR',
//         error:
//           error instanceof Error
//             ? error.message
//             : 'Unknown initialization error',
//       });
//     }
//   } else if (type === 'PARSE') {
//     try {
//       // Ensure WASM is initialized
//       if (!wasmModule) {
//         console.log('Worker: WASM not initialized, trying to initialize...');
//         const success = await initWasm();
//         if (!success) {
//           throw new Error('WASM initialization failed');
//         }
//       }

//       // Update progress
//       self.postMessage({ type: 'progress', progress: 20 });

//       // Process the replay data
//       const replayData = new Uint8Array(payload);
//       console.log(`Worker: Got replay data of length ${replayData.length}`);

//       // Update progress
//       self.postMessage({ type: 'progress', progress: 40 });

//       // Parse the replay
//       if (!wasmModule || typeof wasmModule.parse !== 'function') {
//         throw new Error('WASM module is not properly initialized');
//       }

//       console.log('Worker: Calling parse function...');
//       const replay = wasmModule.parse(replayData);

//       // Update progress
//       self.postMessage({ type: 'progress', progress: 80 });

//       // Ensure the replay object exists
//       if (!replay) {
//         throw new Error('Parsing failed: null replay object returned');
//       }

//       // Extract data from the replay object
//       console.log('Worker: Extracting data from parsed replay...');
//       const headerJson = replay.header_json(false);
//       const networkErr = replay.network_err();

//       // Format the result
//       const result = {
//         replay: JSON.parse(headerJson),
//         networkErr: networkErr || null,
//       };

//       // Send the parsed data back to the main thread
//       self.postMessage({
//         type: 'PARSE_SUCCESS',
//         result,
//       });
//     } catch (error) {
//       console.error('Worker: Parse error:', error);
//       self.postMessage({
//         type: 'PARSE_ERROR',
//         error: error instanceof Error ? error.message : 'Unknown parsing error',
//       });
//     }
//   }
// });

// // Log that the worker is initialized
// console.log('Replay worker initialized');

// Fixed worker implementation that properly handles public path

// Type definition for the WASM module
type WasmModule = {
  default: (wasmPath?: string) => Promise<any>;
  parse: (data: Uint8Array) => any;
};

// Initialize as null
let wasmModule: WasmModule | null = null;

// Initialize the WASM module with explicit path handling
async function initWasm(): Promise<boolean> {
  try {
    console.log('Worker: Starting WASM initialization...');

    // Get the current worker location to help with path resolution
    const workerLocation = self.location.href;
    console.log('Worker location:', workerLocation);

    // Import the JS module
    const module = await import('../../crate/pkg/rl_wasm');

    console.log('Worker: JS module imported, attempting initialization...');

    // First, try with a direct import (let webpack handle it)
    try {
      // Note: This relies on the webpack configuration correctly handling the WASM import
      await module.default();
      wasmModule = module as unknown as WasmModule;
      console.log('Worker: WASM initialized with default path');
      return true;
    } catch (error) {
      console.log(
        'Worker: Default path failed, trying public folder paths...',
        error
      );

      // Try with explicit paths in the public folder
      // Use both absolute and relative paths for maximum compatibility
      const pathsToTry = [
        '/wasm/rl_wasm_bg.wasm', // Absolute path from root
        './wasm/rl_wasm_bg.wasm', // Relative path
        '../wasm/rl_wasm_bg.wasm', // One level up
        '../../wasm/rl_wasm_bg.wasm', // Two levels up
        '../../../wasm/rl_wasm_bg.wasm', // Three levels up
        '../../public/wasm/rl_wasm_bg.wasm', // Direct to public folder
        '../../../public/wasm/rl_wasm_bg.wasm', // Up to project root
      ];

      // Try each path
      for (const path of pathsToTry) {
        try {
          console.log(`Worker: Trying path: ${path}`);
          await module.default(path);
          wasmModule = module as unknown as WasmModule;
          console.log(`Worker: Successfully initialized with path: ${path}`);
          return true;
        } catch (pathError) {
          console.log(`Worker: Failed with path: ${path}`);
        }
      }

      // If we get here, none of the paths worked
      throw new Error('Failed to initialize WASM with any path');
    }
  } catch (error) {
    console.error('Worker: Failed to initialize WASM module:', error);
    return false;
  }
}

// Handler for messages from the main thread
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data;
  console.log(`Worker: Received message type: ${type}`);

  if (type === 'INIT') {
    try {
      // Initialize the WASM module
      const success = await initWasm();
      if (success) {
        self.postMessage({ type: 'INIT_SUCCESS' });
      } else {
        throw new Error('WASM initialization failed');
      }
    } catch (error) {
      console.error('Worker: Init error:', error);
      self.postMessage({
        type: 'INIT_ERROR',
        error:
          error instanceof Error
            ? error.message
            : 'Unknown initialization error',
      });
    }
  } else if (type === 'PARSE') {
    try {
      // Ensure WASM is initialized
      if (!wasmModule) {
        console.log('Worker: WASM not initialized, trying to initialize...');
        const success = await initWasm();
        if (!success) {
          throw new Error('WASM initialization failed');
        }
      }

      // Update progress
      self.postMessage({ type: 'progress', progress: 20 });

      // Process the replay data
      const replayData = new Uint8Array(payload);
      console.log(`Worker: Got replay data of length ${replayData.length}`);

      // Update progress
      self.postMessage({ type: 'progress', progress: 40 });

      // Parse the replay
      if (!wasmModule || typeof wasmModule.parse !== 'function') {
        throw new Error('WASM module is not properly initialized');
      }

      console.log('Worker: Calling parse function...');
      const replay = wasmModule.parse(replayData);

      // Update progress
      self.postMessage({ type: 'progress', progress: 80 });

      // Ensure the replay object exists
      if (!replay) {
        throw new Error('Parsing failed: null replay object returned');
      }

      // Extract data from the replay object
      console.log('Worker: Extracting data from parsed replay...');
      const headerJson = replay.header_json(false);
      const fullJSON = replay.full_json(false);
      console.log('Worker: Full JSON:', fullJSON);
      const networkErr = replay.network_err();

      // Format the result
      const result = {
        replay: JSON.parse(headerJson),
        networkErr: networkErr || null,
      };

      // Send the parsed data back to the main thread
      self.postMessage({
        type: 'PARSE_SUCCESS',
        result,
      });
    } catch (error) {
      console.error('Worker: Parse error:', error);
      self.postMessage({
        type: 'PARSE_ERROR',
        error: error instanceof Error ? error.message : 'Unknown parsing error',
      });
    }
  }
});

// Log that the worker is initialized
console.log('Replay worker initialized');
