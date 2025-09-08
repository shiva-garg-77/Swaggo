# 🚀 Enhanced Instagram-Like App - Setup & Test Guide

## ✨ **What's New & Functional:**

### **Backend Features:**
- ✅ **Separate Post & Comment Likes** - Independent like systems
- ✅ **Nested Comment Replies** - Unlimited depth comment threads
- ✅ **Real-time Counts** - Auto-calculated like/comment counts
- ✅ **User Interaction States** - Track what user has liked/saved
- ✅ **Video Autoplay & Loop** - Configurable video playback
- ✅ **Post Statistics API** - Comprehensive post stats endpoint

### **Frontend Features:**
- ✅ **Functional Like Buttons** - Connected to backend
- ✅ **Functional Save Buttons** - Connected to backend  
- ✅ **Comment System** - Create comments and replies
- ✅ **Video Autoplay** - Videos play automatically with loop
- ✅ **Image Navigation** - Forward/backward for multiple images
- ✅ **Real-time Updates** - UI updates when actions performed
- ✅ **Responsive Design** - Works on all screen sizes

---

## 🛠 **Setup Instructions:**

### **1. Backend Setup:**
```bash
cd Backend
npm install
node main.js
```
- Backend runs on `http://localhost:45799/graphql`
- MongoDB connection required

### **2. Frontend Setup:**
```bash
cd Frontend
npm install
npm run dev
```
- Frontend runs on `http://localhost:3000`
- Connects to backend GraphQL endpoint

---

## 🎯 **How to Test:**

### **1. Create Test Data:**
```graphql
# 1. Create a profile
mutation {
  CreateProfile(username: "testuser") {
    profileid
    username
  }
}

# 2. Create a post
mutation {
  CreatePost(
    profileid: "your-profile-id"
    postUrl: "https://picsum.photos/600/400"
    title: "Test Post"
    Description: "Testing the enhanced like/comment system!"
    postType: "IMAGE"
    autoPlay: false
    allowComments: true
    hideLikeCount: false
  ) {
    postid
    title
    likeCount
    commentCount
    isLikedByUser
  }
}
```

### **2. Test Frontend Features:**

#### **Post Interactions:**
- ❤️ **Click Like Button** - Should toggle like state and update count
- 💾 **Click Save Button** - Should toggle save state  
- 💬 **Click Comments** - Opens post modal with full functionality

#### **Post Modal Features:**
- 📱 **Full Post View** - Shows all post details and interactions
- 💬 **Comment Creation** - Add new comments
- 💬 **Reply to Comments** - Nested comment replies
- ❤️ **Like Comments** - Individual comment likes
- 🎥 **Video Autoplay** - Videos play automatically if enabled
- ⏭️ **Image Navigation** - Forward/backward buttons for multiple images

#### **Real-time Updates:**
- Like counts update immediately
- Comment counts update when comments added
- User interaction states persist

---

## 🎮 **Test Scenarios:**

### **Scenario 1: Basic Post Interaction**
1. Open home page
2. Click like button on any post
3. Verify like count increases and button changes color
4. Click save button and verify save state

### **Scenario 2: Comment System**
1. Click on a post to open modal
2. Add a comment in the input field
3. Verify comment appears in the list
4. Like the comment and verify like count
5. Reply to the comment and verify nested structure

### **Scenario 3: Video Features**
1. Create a post with `postType: "VIDEO"`
2. Set `autoPlay: true`
3. Verify video plays automatically with loop
4. Check video controls work properly

### **Scenario 4: Multiple Images**
1. Create post with array of image URLs in `postUrl`
2. Open post modal
3. Verify navigation arrows appear
4. Test forward/backward navigation
5. Check image indicators at bottom

---

## 🔧 **GraphQL Playground Testing:**

Visit `http://localhost:45799/graphql` to test queries directly:

### **Essential Queries:**
```graphql
# Get all posts with enhanced data
query {
  getPosts {
    postid
    title
    likeCount
    commentCount
    isLikedByUser
    isSavedByUser
    profile {
      username
      profilePic
    }
    comments {
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
}

# Get post statistics  
query {
  getPostStats(postid: "your-post-id") {
    likeCount
    commentCount
    isLikedByCurrentUser
    isSavedByCurrentUser
  }
}
```

### **Essential Mutations:**
```graphql
# Like a post
mutation {
  TogglePostLike(profileid: "your-profile-id", postid: "post-id") {
    profileid
    postid
    createdAt
  }
}

# Like a comment
mutation {
  ToggleCommentLike(profileid: "your-profile-id", commentid: "comment-id") {
    profileid
    commentid
    createdAt  
  }
}

# Create a comment
mutation {
  CreateComment(postid: "post-id", profileid: "your-profile-id", comment: "Great post!") {
    commentid
    comment
    likeCount
    isLikedByUser
  }
}

# Reply to a comment
mutation {
  CreateCommentReply(commentid: "parent-comment-id", profileid: "your-profile-id", comment: "I agree!") {
    commentid
    comment
    likeCount
    isLikedByUser
  }
}
```

---

## 🎉 **Success Indicators:**

### ✅ **Backend Working:**
- GraphQL playground accessible
- Mutations execute without errors
- Data persists in MongoDB
- Real-time counts accurate

### ✅ **Frontend Working:**
- Posts display with real data
- Like buttons functional and update UI
- Save buttons functional
- Post modal opens with full data
- Comments can be created and liked
- Video autoplay works
- Image navigation works

### ✅ **Integration Working:**
- Frontend actions trigger backend mutations
- UI updates reflect backend changes
- Error handling works
- Authentication states respected

---

## 🚨 **Troubleshooting:**

### **Common Issues:**
1. **GraphQL Errors**: Check backend console for detailed error messages
2. **Authentication Issues**: Ensure user context is properly set
3. **Video Not Playing**: Check browser autoplay policies
4. **Likes Not Working**: Verify user is authenticated and profileid exists

### **Debug Tips:**
- Check browser console for error messages
- Use GraphQL playground to test backend directly
- Verify MongoDB connection and data structure
- Check network tab for failed API calls

---

## 🎯 **Ready to Use!**

Your enhanced Instagram-like application is now fully functional with:
- ✅ Real-time like/comment system
- ✅ Video autoplay and loop
- ✅ Image navigation
- ✅ Nested comments
- ✅ User interaction tracking
- ✅ Modern responsive UI

**Everything works seamlessly between frontend and backend!** 🚀
