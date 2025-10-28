# Models Directory

This directory contains all the Mongoose models used in the Swaggo application.

## Structure

- `FeedModels/` - Contains models related to the social feed functionality
- `*.js` - Top-level models for core application functionality

## Model Categories

### Feed Models
Located in the [FeedModels](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels) directory, these models handle social feed functionality:

- [AuditLog.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/AuditLog.js) - Tracks user actions and system events
- [BlockedAccounts.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/BlockedAccounts.js) - Manages blocked user accounts
- [CallLog.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/CallLog.js) - Stores call history and metadata
- [Chat.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Chat.js) - Represents chat rooms and conversations
- [CloseFriends.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/CloseFriends.js) - Manages close friends lists
- [CollaborativeDocument.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/CollaborativeDocument.js) - Handles collaborative document editing
- [Comments.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Comments.js) - Stores user comments on posts
- [Draft.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Draft.js) - Manages post drafts
- [File.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/File.js) - Represents uploaded files
- [FollowRequest.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/FollowRequest.js) - Handles follow requests
- [Followers.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Followers.js) - Tracks user followers
- [Following.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Following.js) - Tracks user following
- [Highlight.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Highlight.js) - Manages story highlights
- [LikedPost.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/LikedPost.js) - Tracks liked posts
- [Likes.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Likes.js) - Stores individual likes
- [Memory.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Memory.js) - Manages memory features
- [Mentions.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Mentions.js) - Handles user mentions
- [Message.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Message.js) - Represents individual messages
- [MessageThread.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/MessageThread.js) - Manages message threads
- [Notification.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Notification.js) - Handles user notifications
- [Poll.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Poll.js) - Manages poll features
- [Post.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Post.js) - Represents user posts
- [Profile.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Profile.js) - User profile information
- [PushSubscription.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/PushSubscription.js) - Manages push notification subscriptions
- [RestrictedAccounts.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/RestrictedAccounts.js) - Handles restricted accounts
- [SavedPost.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/SavedPost.js) - Tracks saved posts
- [ScheduledMessage.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/ScheduledMessage.js) - Manages scheduled messages
- [Shares.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Shares.js) - Tracks post shares
- [Story.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Story.js) - Represents user stories
- [Tagpost.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/Tagpost.js) - Handles tagged posts
- [UserSettings.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/FeedModels/UserSettings.js) - Manages user-specific settings

### Core Models
Located in the root Models directory:

- [Advertisement.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/Advertisement.js) - Advertisement and promotional content
- [Event.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/Event.js) - System events and scheduled tasks
- [PasswordResetToken.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/PasswordResetToken.js) - Password reset tokens
- [RefreshToken.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/RefreshToken.js) - JWT refresh tokens
- [Snapshot.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/Snapshot.js) - Data snapshots for versioning
- [Subscription.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/Subscription.js) - User subscription information
- [User.js](file:///c:/swaggo-testing/Swaggo/Website/Backend/Models/User.js) - Core user information

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