"use client";

import { useState } from 'react';
import { useAuth } from '../Helper/AuthProvider';
import { useMutation, gql } from '@apollo/client';

const TOGGLE_POST_LIKE_DEBUG = gql`
  mutation TogglePostLike($profileid: String!, $postid: String!) {
    TogglePostLike(profileid: $profileid, postid: $postid) {
      profileid
      postid
      createdAt
    }
  }
`;

export default function LikeDebug() {
  const { user, accessToken, debugUserData } = useAuth();
  const [testPostId, setTestPostId] = useState("test-post-123");
  const [result, setResult] = useState("");

  const [togglePostLike] = useMutation(TOGGLE_POST_LIKE_DEBUG);

  const handleDebugLike = async () => {
    console.log('\n🔬 === LIKE DEBUG TEST ===');
    
    // Debug user data first
    const userData = debugUserData();
    console.log('Debug User Data:', userData);

    setResult("Testing...");

    try {
      console.log('Variables being sent:');
      console.log('- profileid:', user?.profileid);
      console.log('- postid:', testPostId);
      console.log('- accessToken present:', !!accessToken);

      if (!user?.profileid) {
        throw new Error('No profileid found in user data');
      }

      const result = await togglePostLike({
        variables: {
          profileid: user.profileid,
          postid: testPostId
        }
      });

      console.log('✅ Success:', result);
      setResult(`SUCCESS: ${JSON.stringify(result.data, null, 2)}`);
      
    } catch (error) {
      console.error('❌ Error:', error);
      setResult(`ERROR: ${error.message}\n\nDetails:\n${JSON.stringify({
        graphQLErrors: error.graphQLErrors?.map(e => ({ message: e.message, extensions: e.extensions })),
        networkError: error.networkError?.message,
        variables: { profileid: user?.profileid, postid: testPostId }
      }, null, 2)}`);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Like Mutation Debug Tool</h1>
        
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <h3 className="font-bold mb-2">Current User Info:</h3>
          <pre className="text-sm">{JSON.stringify({
            hasAccessToken: !!accessToken,
            user: user,
            profileid: user?.profileid
          }, null, 2)}</pre>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Post ID:
          </label>
          <input
            type="text"
            value={testPostId}
            onChange={(e) => setTestPostId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter a test post ID"
          />
        </div>

        <button
          onClick={handleDebugLike}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
        >
          Test Like Mutation
        </button>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-bold mb-2">Result:</h3>
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
