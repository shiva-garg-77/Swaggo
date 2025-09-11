"use client";

import { useQuery } from '@apollo/client';
import { GET_POST_COMMENTS } from '../../../lib/graphql/queries';

export default function TestComments({ postId }) {
  const { data, loading, error } = useQuery(GET_POST_COMMENTS, {
    variables: { postid: postId },
    skip: !postId,
    errorPolicy: 'all'
  });

  console.log('TestComments Debug:', {
    postId,
    loading,
    error,
    data
  });

  if (loading) return <div>Loading comments...</div>;
  if (error) {
    console.error('GraphQL Error:', error);
    return <div>Error: {error.message}</div>;
  }

  const comments = data?.getCommentsByPost || [];

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Test Comments ({comments.length})</h3>
      {comments.length === 0 ? (
        <div>No comments found</div>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div key={comment.commentid} className="border-l-2 border-blue-500 pl-2">
              <div className="font-semibold">{comment.profile?.username}</div>
              <div>{comment.comment}</div>
              <div className="text-sm text-gray-500">
                Likes: {comment.likeCount} | Replies: {comment.replies?.length || 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
