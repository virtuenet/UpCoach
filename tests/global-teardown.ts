/**
 * Global teardown for Jest test environment
 * Cleans up resources after all tests complete
 */

export default async function globalTeardown() {
  console.log('🧹 Global test teardown started...');

  try {
    // Clean up any global resources
    
    // Close database connections if any
    if (global.__DATABASE_CONNECTION__) {
      await global.__DATABASE_CONNECTION__.close();
      console.log('✅ Database connections closed');
    }

    // Clean up any test containers
    if (global.__TEST_CONTAINERS__) {
      for (const container of global.__TEST_CONTAINERS__) {
        await container.stop();
      }
      console.log('✅ Test containers stopped');
    }

    // Clean up temporary files
    if (global.__TEMP_FILES__) {
      const fs = require('fs').promises;
      for (const file of global.__TEMP_FILES__) {
        try {
          await fs.unlink(file);
        } catch (error) {
          // File might not exist, ignore
        }
      }
      console.log('✅ Temporary files cleaned up');
    }

    console.log('🏁 Global test teardown completed successfully');
  } catch (error) {
    console.error('❌ Error during global teardown:', error);
  }
}