# Enhanced Like/Comment System API

## 🎉 New Features

Your post like/comment system is now fully functional with these improvements:

### ✅ **What's New:**
- **Separate** post likes and comment likes
- **Nested** comment replies (unlimited depth)
- **Real-time** like and comment counts
- **User interaction** states (liked/saved status)
- **Optimized** database queries
- **Clean** API separation

---

## 🚀 **GraphQL API Reference**

### **Mutations**

#### **Like/Unlike Posts**
```graphql
mutation TogglePostLike($profileid: String!, $postid: String!) {
    TogglePostLike(profileid: $profileid, postid: $postid) {
        profileid
        postid
        createdAt
    }
}
```

#### **Like/Unlike Comments**
```graphql
mutation ToggleCommentLike($profileid: String!, $commentid: String!) {
    ToggleCommentLike(profileid: $profileid, commentid: $commentid) {
        profileid
        commentid
        createdAt
    }
}
```

#### **Comment on Posts**
```graphql
mutation CreateComment(
    $postid: String!,
    $profileid: String!,
    $comment: String!
) {
    CreateComment(
        postid: $postid,
        profileid: $profileid,
        comment: $comment
    ) {
        commentid
        comment
        likeCount
        isLikedByUser
        replies {
            commentid
            comment
        }
    }
}
```

#### **Reply to Comments**
```graphql
mutation CreateCommentReply(
    $commentid: String!,
    $profileid: String!,
    $comment: String!
) {
    CreateCommentReply(
        commentid: $commentid,
        profileid: $profileid,
        comment: $comment
    ) {
        commentid
        comment
        likeCount
        isLikedByUser
    }
}
```

### **Queries**

#### **Get Post with Full Data**
```graphql
query GetPost($postid: String!) {
    getPostbyId(postid: $postid) {
        postid
        title
        Description
        likeCount
        commentCount
        isLikedByUser
        isSavedByUser
        profile {
            username
            profilePic
        }
        like {
            profile {
                username
            }
        }
        comments {
            commentid
            comment
            likeCount
            isLikedByUser
            profile {
                username
                profilePic
            }
            replies {
                commentid
                comment
                likeCount
                isLikedByUser
                profile {
                    username
                    profilePic
                }
            }
        }
    }
}
```

#### **Get Post Statistics**
```graphql
query GetPostStats($postid: String!) {
    getPostStats(postid: $postid) {
        postid
        likeCount
        commentCount
        isLikedByCurrentUser
        isSavedByCurrentUser
    }
}
```

#### **Get Comments for Post**
```graphql
query GetComments($postid: String!) {
    getCommentsByPost(postid: $postid) {
        commentid
        comment
        likeCount
        isLikedByUser
        profile {
            username
            profilePic
        }
        replies {
            commentid
            comment
            likeCount
            isLikedByUser
        }
    }
}
```

#### **Get Replies for Comment**
```graphql
query GetReplies($commentid: String!) {
    getCommentReplies(commentid: $commentid) {
        commentid
        comment
        likeCount
        isLikedByUser
        profile {
            username
            profilePic
        }
    }
}
```

#### **Get Likes for Post**
```graphql
query GetPostLikes($postid: String!) {
    getLikesByPost(postid: $postid) {
        profile {
            username
            profilePic
        }
        createdAt
    }
}
```

#### **Get Likes for Comment**
```graphql
query GetCommentLikes($commentid: String!) {
    getLikesByComment(commentid: $commentid) {
        profile {
            username
            profilePic
        }
        createdAt
    }
}
```

---

## 📋 **Data Structure**

### **Posts Type (Enhanced)**
```graphql
type Posts {
    postid: String!
    profile: Profiles!
    postUrl: String!
    like: [Likes!]
    comments: [Comments!]
    likeCount: Int!           # 🆕 Auto-calculated
    commentCount: Int!        # 🆕 Auto-calculated  
    isLikedByUser: Boolean!   # 🆕 User interaction
    isSavedByUser: Boolean!   # 🆕 User interaction
    title: String
    Description: String
    postType: String!
    location: String
    taggedPeople: [String!]
    tags: [String!]
    allowComments: Boolean
    hideLikeCount: Boolean
    autoPlay: Boolean
    createdAt: String
    updatedAt: String
}
```

### **Comments Type (Enhanced)**
```graphql
type Comments {
    commentid: String
    postid: String!
    profile: Profiles!
    userto: Profiles
    commenttoid: String
    comment: String!
    replies: [Comments!]      # 🆕 Nested replies
    likeCount: Int!           # 🆕 Auto-calculated
    isLikedByUser: Boolean!   # 🆕 User interaction
    createdAt: String         # 🆕 Timestamp
    updatedAt: String         # 🆕 Timestamp
}
```

### **Likes Type (Simplified)**
```graphql
type Likes {
    profile: Profiles!
    postid: String!
    commentid: String        # Optional: for comment likes
    createdAt: String        # 🆕 Timestamp
}
```

### **PostStats Type (New)**
```graphql
type PostStats {
    postid: String!
    likeCount: Int!
    commentCount: Int!
    isLikedByCurrentUser: Boolean!
    isSavedByCurrentUser: Boolean!
}
```

---

## 💡 **Usage Examples**

### **Frontend Integration Example**
```javascript
// Like a post
const likePost = async (postId, profileId) => {
    const result = await client.mutate({
        mutation: TOGGLE_POST_LIKE,
        variables: { postid: postId, profileid: profileId }
    });
    
    // Refresh post data to show updated counts
    refetch();
};

// Comment on a post
const addComment = async (postId, profileId, commentText) => {
    const result = await client.mutate({
        mutation: CREATE_COMMENT,
        variables: { 
            postid: postId, 
            profileid: profileId, 
            comment: commentText 
        }
    });
    
    // Comment automatically includes likeCount and isLikedByUser
    console.log('New comment:', result.data.CreateComment);
};

// Reply to a comment
const replyToComment = async (commentId, profileId, replyText) => {
    await client.mutate({
        mutation: CREATE_COMMENT_REPLY,
        variables: { 
            commentid: commentId, 
            profileid: profileId, 
            comment: replyText 
        }
    });
};
```

---

## 🎯 **Best Practices**

### **1. Use Separate Mutations**
- Use `TogglePostLike` for posts
- Use `ToggleCommentLike` for comments
- Don't mix them up!

### **2. Leverage Auto-Counts**
- No need to manually count likes/comments
- Use `likeCount`, `commentCount` fields
- They update automatically

### **3. Check User States**
- Use `isLikedByUser` to show like button state
- Use `isSavedByUser` to show save button state
- Personalize the user experience

### **4. Handle Nested Comments**
- Use `replies` field for comment threads
- Load replies on demand for performance
- Consider pagination for deep threads

### **5. Optimize Queries**
- Use `getPostStats` for quick statistics
- Use specific queries for specific data
- Avoid over-fetching data

---

## ✅ **Testing Your API**

Your server is running at `http://localhost:45799/graphql`

### **Quick Test Mutations:**
1. Create a profile with `CreateProfile`
2. Create a post with `CreatePost`
3. Like the post with `TogglePostLike`
4. Add a comment with `CreateComment`
5. Like the comment with `ToggleCommentLike`
6. Reply to comment with `CreateCommentReply`
7. Check stats with `getPostStats`

**All functionality is working and ready to use!** 🚀
