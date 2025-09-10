/**
 * Memory Test Utilities
 * Helper functions to test memory functionality and postUrl integration
 */

// Test memory creation with postUrl
export const testCreateMemoryWithPostUrl = (createMemoryMutation, user, postUrl = null) => {
  console.log('🧪 Testing memory creation with postUrl:', {
    user: user?.username,
    postUrl,
    timestamp: new Date().toISOString()
  });

  const testMemory = {
    profileid: user?.profileid,
    title: `Test Memory ${Date.now()}`,
    coverImage: postUrl || 'https://picsum.photos/200/200?random=1',
    postUrl: postUrl
  };

  return createMemoryMutation({
    variables: testMemory
  }).then((result) => {
    console.log('✅ Memory creation test successful:', result);
    return result;
  }).catch((error) => {
    console.error('❌ Memory creation test failed:', error);
    throw error;
  });
};

// Test memory query with postUrl field
export const testMemoryQuery = (getMemoriesQuery, profileid) => {
  console.log('🧪 Testing memory query with postUrl field:', {
    profileid,
    timestamp: new Date().toISOString()
  });

  return getMemoriesQuery({
    variables: { profileid }
  }).then((result) => {
    const memories = result?.data?.getMemories || [];
    console.log('✅ Memory query test results:', {
      totalMemories: memories.length,
      memoriesWithPostUrl: memories.filter(m => m.postUrl).length,
      memories: memories.map(m => ({
        title: m.title,
        hasPostUrl: !!m.postUrl,
        postUrl: m.postUrl,
        stories: m.stories?.length || 0
      }))
    });
    return result;
  }).catch((error) => {
    console.error('❌ Memory query test failed:', error);
    throw error;
  });
};

// Validate memory object has required fields including postUrl
export const validateMemoryObject = (memory) => {
  const requiredFields = ['memoryid', 'title', 'profileid'];
  const optionalFields = ['coverImage', 'postUrl', 'stories', 'createdAt', 'updatedAt'];
  
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    hasPostUrl: !!memory.postUrl
  };

  // Check required fields
  requiredFields.forEach(field => {
    if (!memory[field]) {
      validation.isValid = false;
      validation.errors.push(`Missing required field: ${field}`);
    }
  });

  // Check optional fields structure
  if (memory.stories && !Array.isArray(memory.stories)) {
    validation.warnings.push('Stories field should be an array');
  }

  if (memory.postUrl && typeof memory.postUrl !== 'string') {
    validation.warnings.push('postUrl should be a string');
  }

  console.log('🔍 Memory validation result:', validation);
  return validation;
};

// Memory component debugging helper
export const debugMemoryComponent = (componentName, memories, user) => {
  console.log(`🐛 Debug ${componentName}:`, {
    componentName,
    timestamp: new Date().toISOString(),
    userAuthenticated: !!user,
    username: user?.username,
    profileid: user?.profileid,
    memoriesCount: memories?.length || 0,
    memoriesWithPostUrl: memories?.filter(m => m.postUrl)?.length || 0,
    firstMemory: memories?.[0] ? {
      title: memories[0].title,
      hasPostUrl: !!memories[0].postUrl,
      storiesCount: memories[0].stories?.length || 0
    } : null
  });
};

export default {
  testCreateMemoryWithPostUrl,
  testMemoryQuery,
  validateMemoryObject,
  debugMemoryComponent
};
