# Feed Models

This directory contains all the Mongoose models related to the social feed functionality of the Swaggo application.

## Overview

These models handle the core social networking features including posts, comments, messages, stories, and user interactions.

## Model Descriptions

### [AuditLog.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/AuditLog.js)
Tracks user actions and system events for security and compliance purposes.

### [BlockedAccounts.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/BlockedAccounts.js)
Manages lists of blocked user accounts to prevent unwanted interactions.

### [CallLog.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/CallLog.js)
Stores call history and metadata for voice and video calls.

### [Chat.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Chat.js)
Represents chat rooms and conversations between users.

### [CloseFriends.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/CloseFriends.js)
Manages close friends lists for special sharing permissions.

### [CollaborativeDocument.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/CollaborativeDocument.js)
Handles collaborative document editing features.

### [Comments.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Comments.js)
Stores user comments on posts and other content.

### [Draft.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Draft.js)
Manages post drafts that users are working on but haven't published yet.

### [File.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/File.js)
Represents uploaded files including images, videos, and documents.

### [FollowRequest.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/FollowRequest.js)
Handles follow requests between users.

### [Followers.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Followers.js)
Tracks user followers for building social graphs.

### [Following.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Following.js)
Tracks which accounts a user is following.

### [Highlight.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Highlight.js)
Manages story highlights that persist beyond the 24-hour story window.

### [LikedPost.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/LikedPost.js)
Tracks which posts a user has liked.

### [Likes.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Likes.js)
Stores individual likes on posts, comments, and other content.

### [Memory.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Memory.js)
Manages memory features that resurface old content.

### [Mentions.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Mentions.js)
Handles user mentions in posts, comments, and messages.

### [Message.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Message.js)
Represents individual messages within chat conversations.

### [MessageThread.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/MessageThread.js)
Manages message threads and conversation metadata.

### [Notification.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Notification.js)
Handles user notifications for various events and interactions.

### [Poll.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Poll.js)
Manages poll features that allow users to create and vote on polls.

### [Post.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Post.js)
Represents user posts including text, images, and other media.

### [Profile.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Profile.js)
User profile information including bio, avatar, and personal details.

### [PushSubscription.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/PushSubscription.js)
Manages push notification subscriptions for web and mobile devices.

### [RestrictedAccounts.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/RestrictedAccounts.js)
Handles restricted accounts that have limited functionality.

### [SavedPost.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/SavedPost.js)
Tracks posts that users have saved for later reference.

### [ScheduledMessage.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/ScheduledMessage.js)
Manages messages that are scheduled to be sent at a future time.

### [Shares.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Shares.js)
Tracks when users share posts and other content.

### [Story.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Story.js)
Represents user stories that are available for 24 hours.

### [Tagpost.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Tagpost.js)
Handles posts where users are tagged.

### [UserSettings.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/UserSettings.js)
Manages user-specific settings and preferences.

## Documentation Standards

Each model file should include:
1. JSDoc comments for the model and its fields
2. Schema definition with clear field descriptions
3. Index definitions for performance optimization
4. Virtual properties and methods
5. Static methods for common operations
6. Middleware hooks (pre/post save, etc.)

## Best Practices

1. All models should use proper validation
2. Sensitive data should be excluded from JSON output
3. Indexes should be created for frequently queried fields
4. Virtual properties should be used for computed values
5. Methods should be used for complex operations
6. Static methods should be used for model-level operations