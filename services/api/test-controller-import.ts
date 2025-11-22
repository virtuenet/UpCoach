/**
 * Test script to debug AIController import issues
 */

console.log('Step 1: Starting import test...');

try {
  console.log('Step 2: Attempting to import AIController...');
  const { aiController } = require('./src/controllers/ai/AIController');

  console.log('Step 3: Import successful!');
  console.log('Step 4: aiController type:', typeof aiController);
  console.log('Step 5: aiController:', aiController);
  console.log('Step 6: createLearningPath type:', typeof aiController.createLearningPath);
  console.log('Step 7: getLearningPaths type:', typeof aiController.getLearningPaths);

  if (aiController && typeof aiController.createLearningPath === 'function') {
    console.log('✓ SUCCESS: aiController.createLearningPath is a function');
  } else {
    console.log('✗ FAIL: aiController.createLearningPath is NOT a function');
  }
} catch (error) {
  console.log('✗ ERROR during import:', error.message);
  console.log('Stack:', error.stack);
}
