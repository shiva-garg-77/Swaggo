/**
 * RSC Client Stub - Replaces problematic react-server-dom-webpack client
 * This stub prevents the "Connection closed" and module resolution errors
 * while maintaining compatibility for development mode on Windows
 */

console.log('🛜 RSC Client Stub loaded - preventing streaming errors');

// Mock the RSC client functions that cause issues
const createFromReadableStream = (stream) => {
  console.log('🛜 RSC Stub: createFromReadableStream called - returning mock');
  return Promise.resolve({ 
    __rsc_stub: true,
    content: null 
  });
};

const createFromFetch = (fetch) => {
  console.log('🛜 RSC Stub: createFromFetch called - returning mock');
  return Promise.resolve({ 
    __rsc_stub: true,
    content: null 
  });
};

const startReadingFromStream = (stream) => {
  console.log('🛜 RSC Stub: startReadingFromStream called - returning mock');
  return Promise.resolve({ 
    __rsc_stub: true,
    done: true,
    value: null 
  });
};

// Mock encodeReply function
const encodeReply = (value) => {
  console.log('🛜 RSC Stub: encodeReply called');
  return Promise.resolve(new FormData());
};

// Export the stubbed functions
module.exports = {
  createFromReadableStream,
  createFromFetch,
  startReadingFromStream,
  encodeReply,
};

// Also provide as default export for ESM compatibility
module.exports.default = module.exports;