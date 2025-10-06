/**
 * 🧪 React JSX Runtime Test - Minimal Version for Next.js 15.5.4
 */

// Test React JSX Runtime Resolution
function testJSXRuntime() {
  try {
    console.log('🧪 Testing React JSX Runtime Resolution...');
    
    // Test 1: Basic React import
    const React = require('react');
    console.log('✅ React imported successfully:', React.version);
    
    // Test 2: JSX Runtime import
    const jsxRuntime = require('react/jsx-runtime');
    console.log('✅ JSX Runtime imported successfully:', Object.keys(jsxRuntime));
    
    // Test 3: JSX Dev Runtime import
    const jsxDevRuntime = require('react/jsx-dev-runtime');
    console.log('✅ JSX Dev Runtime imported successfully:', Object.keys(jsxDevRuntime));
    
    // Test 4: React DOM import
    const ReactDOM = require('react-dom');
    console.log('✅ React DOM imported successfully');
    
    // Test 5: React DOM Client
    const ReactDOMClient = require('react-dom/client');
    console.log('✅ React DOM Client imported successfully:', Object.keys(ReactDOMClient));
    
    console.log('🎉 ALL TESTS PASSED - React JSX Runtime is working perfectly!');
    return true;
    
  } catch (error) {
    console.error('❌ JSX Runtime Test Failed:', error.message);
    console.error('📍 Failed at:', error.stack);
    return false;
  }
}

// Run test
if (require.main === module) {
  testJSXRuntime();
}

module.exports = { testJSXRuntime };