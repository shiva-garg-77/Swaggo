import mongoose from 'mongoose';

/**
 * 🌍 GLOBAL TEST SETUP
 * 
 * Runs once before all test suites to:
 * - Initialize test database
 * - Setup test environment
 * - Configure security settings
 */

export default async function globalSetup() {
  console.log('🚀 Setting up global test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  
  // Initialize test database connection
  try {
    const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/swaggo_test';
    await mongoose.connect(mongoUri);
    
    // Clean the test database completely
    await mongoose.connection.db.dropDatabase();
    
    console.log('✅ Test database initialized and cleaned');
    
    // Close the connection (individual tests will create their own)
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
  
  console.log('🎯 Global test setup completed successfully');
}