import { makeVar } from '@apollo/client';

// Reactive variables for triggering refetches
export const postsRefetchVar = makeVar(0);
export const commentsRefetchVar = makeVar({});
export const memoriesRefetchVar = makeVar(0);

// Helper functions to trigger refetches
export const triggerPostsRefetch = () => {
  postsRefetchVar(postsRefetchVar() + 1);
  console.log('🔄 Triggered posts refetch');
};

export const triggerCommentsRefetch = (postid) => {
  const current = commentsRefetchVar();
  commentsRefetchVar({
    ...current,
    [postid]: (current[postid] || 0) + 1
  });
  console.log('🔄 Triggered comments refetch for post:', postid);
};

export const triggerMemoriesRefetch = () => {
  memoriesRefetchVar(memoriesRefetchVar() + 1);
  console.log('🔄 Triggered memories refetch');
};

// Hook to get current refetch state
export const useRefetchTrigger = () => ({
  posts: postsRefetchVar(),
  comments: commentsRefetchVar(),
  memories: memoriesRefetchVar()
});
