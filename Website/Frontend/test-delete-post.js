// Test script to verify delete post functionality
// Run this in browser console after logging in

const testDeletePost = async (postId) => {
  try {
    console.log('🧪 Testing delete post with ID:', postId);
    
    const response = await fetch('http://localhost:45799/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || 'your-token-here'}`
      },
      body: JSON.stringify({
        query: `
          mutation DeletePost($postid: String!) {
            DeletePost(postid: $postid) {
              postid
              title
              postUrl
              postType
            }
          }
        `,
        variables: {
          postid: postId
        }
      })
    });
    
    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL Errors:', result.errors);
      return false;
    }
    
    if (result.data?.DeletePost) {
      console.log('✅ Post deleted successfully:', result.data.DeletePost);
      return true;
    }
    
    console.error('❌ Unexpected response:', result);
    return false;
    
  } catch (error) {
    console.error('❌ Network error:', error);
    return false;
  }
};

// Usage:
// testDeletePost('your-post-id-here');

console.log('🧪 Delete Post Test Script Loaded');
console.log('Usage: testDeletePost("your-post-id-here")');
