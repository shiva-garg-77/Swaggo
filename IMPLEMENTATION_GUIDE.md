# GraphQL Query Implementation Guide

## Overview
This guide documents the newly implemented GraphQL queries and how to integrate them into your components.

---

## ✅ NEW IMPLEMENTATIONS

### 1. Stories from Following Users (GET_FOLLOWING_STORIES)

**Component Created:** `Components/MainComponents/Story/StoriesBar.js`

**Usage:**
```jsx
import StoriesBar from '../Story/StoriesBar';

function HomeContent() {
  const handleCreateStory = () => {
    // Open story upload modal
  };
  
  const handleStoryClick = (stories) => {
    // View user stories
    console.log('View stories:', stories);
  };

  return (
    <StoriesBar 
      onCreateStory={handleCreateStory}
      onStoryClick={handleStoryClick}
    />
  );
}
```

**Features:**
- Displays stories from users you follow
- Shows unviewed stories with gradient ring
- Horizontal scroll with navigation buttons
- Auto-refresh every minute
- Click to view stories
- Create new story button

**Already Integrated In:**
- ✅ `Components/MainComponents/Home/HomeContent.js`

---

### 2. Mention Functionality (CREATE_MENTION)

**Files Created:**
1. `utils/mentionParser.js` - Utility functions for parsing mentions
2. `Components/Helper/MentionInput.js` - Input with mention autocomplete
3. `Components/Helper/MentionDisplay.js` - Display text with clickable mentions
4. `Components/Helper/MentionsViewer.js` - View mentions by context

#### A. Using MentionInput Component

**Basic Usage:**
```jsx
import MentionInput from '../../Helper/MentionInput';
import { extractMentions, createMentions } from '../../../utils/mentionParser';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { CREATE_MENTION } from '../../../lib/graphql/profileQueries';
import { SEARCH_USERS } from '../../../lib/graphql/queries';

function CommentInput({ postId }) {
  const [comment, setComment] = useState('');
  const [createMention] = useMutation(CREATE_MENTION);
  const [searchUsers] = useLazyQuery(SEARCH_USERS);
  
  const handleSubmit = async () => {
    // Extract mentions from comment
    const mentions = extractMentions(comment);
    
    // Create comment first...
    const commentResult = await createComment({ ... });
    
    // Then create mention records
    if (mentions.length > 0 && commentResult.data?.CreateComment) {
      await createMentions({
        mentions,
        mentionerProfileId: user.profileid,
        contextType: 'comment',
        contextId: commentResult.data.CreateComment.commentid,
        createMentionMutation: createMention,
        getUserByUsername: async (username) => {
          const result = await searchUsers({ 
            variables: { query: username, limit: 1 } 
          });
          return result.data?.searchUsers?.[0];
        }
      });
    }
  };

  return (
    <MentionInput
      value={comment}
      onChange={setComment}
      onSubmit={handleSubmit}
      placeholder="Write a comment... Use @ to mention"
      theme="light"
    />
  );
}
```

**Features:**
- Auto-complete when typing @username
- Keyboard navigation (Arrow keys, Enter, Escape)
- Search users in real-time
- Character count
- Enter to submit (Shift+Enter for new line)

#### B. Displaying Text with Mentions

**Usage:**
```jsx
import MentionDisplay from '../../Helper/MentionDisplay';

function Comment({ text, theme }) {
  return (
    <MentionDisplay 
      text={text}
      theme={theme}
      onMentionClick={(username) => {
        // Navigate to user profile or custom action
        console.log('Clicked:', username);
      }}
    />
  );
}
```

**Features:**
- Automatically detects @mentions in text
- Makes mentions clickable
- Default navigation to user profile
- Custom click handlers

---

### 3. Context Mentions Viewer (GET_MENTIONS_BY_CONTEXT)

**Component:** `Components/Helper/MentionsViewer.js`

**Usage:**
```jsx
import MentionsViewer from '../../Helper/MentionsViewer';

function PostDetail({ postId, theme }) {
  return (
    <div>
      {/* Your post content */}
      
      {/* Show who was mentioned in this post */}
      <MentionsViewer 
        contextType="post"
        contextId={postId}
        theme={theme}
        compact={false}
      />
    </div>
  );
}
```

**Features:**
- Shows all mentions for a post/comment
- Expandable/collapsible view
- Displays user profile pictures
- Shows verified badges
- Compact mode for inline display
- Unread indicator

**Props:**
- `contextType`: 'post', 'comment', or 'story'
- `contextId`: ID of the post/comment/story
- `theme`: 'light' or 'dark'
- `compact`: Boolean for compact display

---

## 🔧 INTEGRATION CHECKLIST

### For Comment Sections

To add mention support to any comment section:

1. **Replace textarea with MentionInput:**
```jsx
// OLD
<textarea value={comment} onChange={e => setComment(e.target.value)} />

// NEW
import MentionInput from '../../Helper/MentionInput';
<MentionInput value={comment} onChange={setComment} onSubmit={handleSubmit} />
```

2. **Extract and create mentions on submit:**
```jsx
import { extractMentions, createMentions } from '../../../utils/mentionParser';
import { CREATE_MENTION } from '../../../lib/graphql/profileQueries';

const [createMention] = useMutation(CREATE_MENTION);

const handleCommentSubmit = async () => {
  const mentions = extractMentions(comment);
  
  // Create comment
  const result = await createComment({ ... });
  
  // Create mentions
  if (mentions.length > 0) {
    await createMentions({
      mentions,
      mentionerProfileId: user.profileid,
      contextType: 'comment',
      contextId: result.data.CreateComment.commentid,
      createMentionMutation: createMention,
      getUserByUsername: async (username) => {
        const result = await searchUsers({ variables: { query: username, limit: 1 } });
        return result.data?.searchUsers?.[0];
      }
    });
  }
};
```

3. **Display mentions in comment text:**
```jsx
import MentionDisplay from '../../Helper/MentionDisplay';

// OLD
<p>{comment.text}</p>

// NEW
<MentionDisplay text={comment.text} theme={theme} />
```

### For Post Detail Views

Add the MentionsViewer component to show who was mentioned:

```jsx
import MentionsViewer from '../../Helper/MentionsViewer';

<div className="post-details">
  {/* Post content */}
  
  <MentionsViewer 
    contextType="post"
    contextId={postId}
    theme={theme}
  />
</div>
```

---

## 📝 EXAMPLE: Complete Comment Section with Mentions

```jsx
import { useState } from 'react';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import MentionInput from '../../Helper/MentionInput';
import MentionDisplay from '../../Helper/MentionDisplay';
import MentionsViewer from '../../Helper/MentionsViewer';
import { extractMentions, createMentions } from '../../../utils/mentionParser';
import { CREATE_COMMENT, CREATE_MENTION } from '../../../lib/graphql/profileQueries';
import { SEARCH_USERS } from '../../../lib/graphql/queries';

function EnhancedCommentSection({ postId, comments, theme, user }) {
  const [commentText, setCommentText] = useState('');
  const [createComment] = useMutation(CREATE_COMMENT);
  const [createMention] = useMutation(CREATE_MENTION);
  const [searchUsers] = useLazyQuery(SEARCH_USERS);

  const handleSubmit = async () => {
    if (!commentText.trim() || !user?.profileid) return;

    try {
      // Extract mentions
      const mentions = extractMentions(commentText);

      // Create comment
      const result = await createComment({
        variables: {
          postid: postId,
          profileid: user.profileid,
          comment: commentText
        }
      });

      // Create mention records
      if (mentions.length > 0 && result.data?.CreateComment) {
        await createMentions({
          mentions,
          mentionerProfileId: user.profileid,
          contextType: 'comment',
          contextId: result.data.CreateComment.commentid,
          createMentionMutation: createMention,
          getUserByUsername: async (username) => {
            const res = await searchUsers({ 
              variables: { query: username, limit: 1 } 
            });
            return res.data?.searchUsers?.[0];
          }
        });
      }

      setCommentText('');
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  return (
    <div>
      {/* Show who is mentioned in this post */}
      <MentionsViewer 
        contextType="post"
        contextId={postId}
        theme={theme}
        compact={false}
      />

      {/* Comments list */}
      {comments.map(comment => (
        <div key={comment.commentid} className="comment">
          <img src={comment.profile.profilePic} alt="" />
          <div>
            <strong>{comment.profile.username}</strong>
            <MentionDisplay text={comment.comment} theme={theme} />
          </div>
        </div>
      ))}

      {/* Comment input with mention support */}
      <MentionInput
        value={commentText}
        onChange={setCommentText}
        onSubmit={handleSubmit}
        placeholder="Write a comment... Use @ to mention users"
        theme={theme}
        maxLength={500}
      />
    </div>
  );
}

export default EnhancedCommentSection;
```

---

## 🎯 RECOMMENDED INTEGRATIONS

### High Priority
1. ✅ **HomeContent.js** - Already has StoriesBar
2. ⚠️ **InstagramCommentSection.js** - Add MentionInput
3. ⚠️ **SimpleCommentSection.js** - Add MentionInput
4. ⚠️ **InstagramPostModal.js** - Add MentionsViewer

### Medium Priority
5. **ReelComments.js** - Add mention support
6. **MomentsComments.js** - Add mention support
7. **All Post Detail Views** - Add MentionsViewer

---

## 🐛 TROUBLESHOOTING

### Mentions not being created
- Check that `CREATE_MENTION` mutation is imported
- Ensure user exists before creating mention
- Verify `contextid` is correct after comment creation

### Autocomplete not showing
- Check that `SEARCH_USERS` query is properly configured
- Ensure Apollo Client is set up correctly
- Verify user is typing @ symbol

### Mentions not clickable
- Use `MentionDisplay` component instead of plain text
- Check theme prop is passed correctly
- Verify router is available

---

## 📊 QUERY STATUS SUMMARY

| Query/Mutation | Status | Usage Location |
|---------------|--------|----------------|
| GET_FOLLOWING_STORIES | ✅ Implemented | HomeContent.js → StoriesBar.js |
| CREATE_MENTION | ✅ Available | Use MentionInput + mentionParser.js |
| GET_MENTIONS_BY_CONTEXT | ✅ Available | Use MentionsViewer.js |
| All other queries | ✅ Already in use | See GRAPHQL_QUERY_AUDIT.md |

---

## 🚀 NEXT STEPS

1. Integrate MentionInput into all comment sections
2. Add MentionsViewer to post detail modals
3. Test mention notifications
4. Consider adding mention analytics
5. Implement story viewer modal for StoriesBar clicks

---

For complete query audit, see: `GRAPHQL_QUERY_AUDIT.md`
