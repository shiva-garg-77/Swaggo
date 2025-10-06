import mongoose from 'mongoose';

/**
 * 🧹 GLOBAL TEST TEARDOWN
 * 
 * Runs once after all test suites to:
 * - Clean up test database
 * - Close connections
 * - Generate security reports
 */

export default async function globalTeardown() {
  console.log('🧹 Starting global test cleanup...');
  
  try {
    // Reconnect to clean up if needed
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/swaggo_test';
      await mongoose.connect(mongoUri);
    }
    
    // Drop test database completely
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.connection.close();
    }
    
    console.log('✅ Test database cleaned and connections closed');
    
    // Force close any remaining connections
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error during global teardown:', error);
    // Don't throw - we want teardown to complete even if there are errors
  }
  
  console.log('🎯 Global test teardown completed');
}