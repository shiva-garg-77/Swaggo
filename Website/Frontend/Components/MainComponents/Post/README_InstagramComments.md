# Instagram-Style Comment System

This document explains how to implement and use the Instagram-style comment system that displays replies in a flat structure with user tags instead of nested replies.

## Features

✅ **Flat Comment Threading**: Like Instagram, replies appear at the same level as main comments
✅ **User Tagging**: Replies show "@username" tags to indicate who is being replied to
✅ **Mention Detection**: Automatic detection of @username mentions in comments
✅ **User Suggestions**: Dropdown suggestions when typing @mentions
✅ **Visual Hierarchy**: Replies are slightly indented and have smaller avatars
✅ **Real-time Updates**: Comments and likes update in real-time

## How It Works

### Traditional Nested Comments vs Instagram Style

**Traditional Nested:**
```
- Comment 1
  - Reply to Comment 1
    - Reply to Reply
- Comment 2
```

**Instagram Flat Style:**
```
- Comment 1
- @user1 Reply to Comment 1
- @user2 Reply to user1
- Comment 2
```

### Database Structure

The system uses these additional fields in the Comment model:

```javascript
{
  // Standard fields
  commentid: String,
  postid: String,
  profileid: String,
  comment: String,
  
  // Instagram-style fields
  isReply: Boolean,
  replyToUserId: String,
  replyToUsername: String,
  originalCommentId: String,
  mentionedUsers: [{
    userId: String,
    username: String
  }]
}
```

## Usage

### Using the InstagramStyleCommentSection Component

```jsx
import InstagramStyleCommentSection from './InstagramStyleCommentSection';

function PostComponent({ post }) {
  return (
    <div>
      {/* Your post content */}
      <InstagramStyleCommentSection 
        postId={post.postid}
        onCommentUpdate={() => {
          // Optional callback when comments change
          console.log('Comments updated');
        }}
      />
    </div>
  );
}
```

### Using the Updated SimpleCommentSection

The existing SimpleCommentSection has been updated to support Instagram-style comments:

```jsx
import SimpleCommentSection from './SimpleCommentSection';

function PostComponent({ post }) {
  return (
    <div>
      {/* Your post content */}
      <SimpleCommentSection 
        postId={post.postid}
        className="border-t"
        onCommentUpdate={() => {
          // Optional callback
        }}
      />
    </div>
  );
}
```

## GraphQL Operations

### Creating a Regular Comment

```graphql
mutation CreateComment($postid: String!, $profileid: String!, $comment: String!) {
  CreateComment(
    postid: $postid
    profileid: $profileid
    comment: $comment
  ) {
    commentid
    comment
    isReply
    mentionedUsers {
      userId
      username
    }
    profile {
      username
      profilePic
    }
  }
}
```

### Creating a Reply (Instagram Style)

```graphql
mutation CreateReply(
  $postid: String!
  $profileid: String!
  $comment: String!
  $replyToUserId: String!
  $replyToUsername: String!
  $originalCommentId: String!
) {
  CreateComment(
    postid: $postid
    profileid: $profileid
    comment: $comment
    replyToUserId: $replyToUserId
    replyToUsername: $replyToUsername
    originalCommentId: $originalCommentId
  ) {
    commentid
    comment
    isReply
    replyToUsername
    mentionedUsers {
      userId
      username
    }
    profile {
      username
      profilePic
    }
  }
}
```

### Fetching Comments

```graphql
query GetPostComments($postid: String!) {
  getCommentsByPost(postid: $postid) {
    commentid
    comment
    isReply
    replyToUsername
    originalCommentId
    likeCount
    isLikedByUser
    createdAt
    mentionedUsers {
      userId
      username
    }
    profile {
      username
      profilePic
      isVerified
    }
  }
}
```

## Key Features Explained

### 1. Flat Comment Display

Comments are grouped in Instagram style:
- Main comments appear first
- Replies to each main comment appear immediately after
- All comments are at the same visual level with slight indentation for replies

### 2. User Tagging

When replying to a comment:
- The reply shows "@username" to indicate who is being replied to
- Multiple levels of replies all appear in the same flat list
- Each reply maintains a reference to the original parent comment

### 3. Mention Detection

- Type "@" followed by a username to mention someone
- Auto-complete suggestions appear as you type
- Mentions are highlighted in blue in the final comment
- Mentioned users are stored in the `mentionedUsers` array

### 4. Visual Design

- Main comments: Regular size avatar (32x32px)
- Replies: Smaller avatar (28x28px), slight left margin
- Reply indicator: Blue "@username" tag before reply text
- Hover effects: Comments highlight on hover
- Like buttons: Appear on hover, red when liked

## Customization

### Theming

The components support both light and dark themes:

```jsx
<InstagramStyleCommentSection 
  postId={postId}
  theme="dark" // or "light"
/>
```

### Styling

Customize the appearance using CSS classes:

```jsx
<InstagramStyleCommentSection 
  postId={postId}
  className="custom-comment-section"
/>
```

### Callbacks

Handle comment updates:

```jsx
<InstagramStyleCommentSection 
  postId={postId}
  onCommentUpdate={() => {
    // Refresh post stats, update counters, etc.
    updatePostCommentCount();
  }}
/>
```

## Migration from Nested Comments

If you have existing nested comments, you can migrate them:

1. **Keep existing data**: The system is backward compatible
2. **Update queries**: Use the new GraphQL fields
3. **Update components**: Switch to Instagram-style components
4. **Test thoroughly**: Ensure existing comments still display correctly

## Best Practices

1. **Performance**: Use pagination for posts with many comments
2. **Real-time**: Implement GraphQL subscriptions for live updates
3. **Moderation**: Add comment filtering and reporting features
4. **Accessibility**: Ensure screen readers can navigate the flat structure
5. **Mobile**: Test on mobile devices for touch interactions

## Troubleshooting

### Comments not displaying in flat style
- Check that your GraphQL query includes the new fields (`isReply`, `replyToUsername`, etc.)
- Ensure your backend resolvers are updated to handle the new comment structure

### Mentions not working
- Verify the `SEARCH_USERS` query is working
- Check that user suggestions are being fetched correctly
- Ensure mention parsing is working in the backend

### Performance issues
- Implement comment pagination
- Use GraphQL query optimization
- Consider using virtual scrolling for long comment lists

## Examples

See the following example implementations:
- `InstagramStyleCommentSection.js` - Full-featured Instagram-style comments
- `SimpleCommentSection.js` - Updated minimal comment section
- `ReelComments.js` - Modal-style comments for reels/stories

## Contributing

When adding features to the comment system:
1. Update both backend resolvers and frontend components
2. Add proper TypeScript types if using TypeScript
3. Test with various comment lengths and user mentions
4. Ensure accessibility compliance
5. Update this documentation
