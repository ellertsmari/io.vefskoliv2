global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

// jsdom strips Node's built-in fetch globals, but next-auth v5 (via
// next/server) needs Request/Response/Headers/fetch at import time.
// Restore them from Node's own implementation.
const nodeGlobals = ["fetch", "Request", "Response", "Headers", "FormData"];
for (const name of nodeGlobals) {
  if (typeof global[name] === "undefined" && typeof globalThis[name] !== "undefined") {
    global[name] = globalThis[name];
  }
}

require("dotenv").config({ path: ".env.local" });
import "@testing-library/jest-dom";
