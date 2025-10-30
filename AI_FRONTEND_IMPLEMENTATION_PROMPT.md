# 🤖 AI PROMPT: Complete Frontend Implementation for Swaggo

**Purpose:** Implement ALL missing frontend features for existing backend functionality  
**Approach:** Feature-complete implementation with modern UI/UX  
**Tech Stack:** Next.js 15, React 19, Apollo Client, Socket.IO, TailwindCSS  

---

## 📋 PROMPT STRUCTURE

Use this prompt with AI coding assistants (Claude, ChatGPT, Cursor, etc.) to implement each feature systematically.

---

## 🎯 MASTER PROMPT TEMPLATE

```
You are an expert frontend developer working on a Next.js 15 social media platform called Swaggo.

CONTEXT:
- The backend has FULLY IMPLEMENTED these features but frontend is missing
- Backend uses GraphQL (Apollo Server), Socket.IO, and REST APIs
- Frontend stack: Next.js 15, React 19, Apollo Client 3.14, Socket.IO Client 4.8, TailwindCSS
- Code style: Modern React with hooks, TypeScript preferred, component composition
- Existing patterns: Use @apollo/client hooks, zustand for state, react-hot-toast for notifications

⚠️ CRITICAL RULE - CHECK EXISTING CODE FIRST:
BEFORE creating ANY new file or component, you MUST:
1. Search the codebase for existing similar components/files
2. Check if the feature already exists (even partially)
3. Look for alternative implementations that serve the same purpose
4. If found: IMPROVE/ENHANCE the existing code instead of creating duplicate
5. If not found: Create comprehensive new implementation

How to check:
- Search for component names: grep -r "ComponentName" Frontend/
- Search for similar functionality: grep -r "feature keyword" Frontend/
- Check common locations:
  * Frontend/Components/MainComponents/[Feature]/
  * Frontend/Components/Helper/
  * Frontend/app/(Main-body)/[route]/
  * Frontend/lib/graphql/
  * Frontend/store/

Examples:
- Before creating NotificationBell.js → Check if NotificationIcon.js exists
- Before creating useNotifications hook → Check if notificationStore.js exists
- Before creating GraphQL queries → Check lib/graphql/ for existing query files
- Before creating modal → Check if Modal.js or similar exists in Helper/

If existing code found:
- Analyze what's missing
- Enhance/extend the existing implementation
- Add missing functionality
- Fix any bugs or issues
- Update documentation

If no existing code:
- Create comprehensive new implementation
- Follow existing patterns and structure
- Reuse existing helper components
- Maintain consistency with codebase

BACKEND API DOCUMENTATION:
[Feature-specific backend details will be inserted here for each feature]

YOUR TASK:
Implement a complete, production-ready frontend for [FEATURE_NAME] that:
1. Integrates with existing backend APIs (GraphQL/Socket.IO/REST)
2. Follows existing code patterns and architecture
3. Provides excellent UX with loading states, error handling, optimistic updates
4. Is fully responsive (mobile, tablet, desktop)
5. Includes proper TypeScript types where applicable
6. Uses existing components where possible
7. Implements real-time updates where relevant

REQUIREMENTS:
- Match Instagram/modern social media UX patterns
- Smooth animations and transitions
- Accessibility considerations
- Proper error boundaries
- Loading skeletons
- Empty states
- Success/error toast notifications

DELIVERABLES:
1. Component files with full implementation
2. GraphQL queries/mutations (if using GraphQL)
3. Socket.IO event handlers (if using Socket.IO)
4. State management (zustand store if needed)
5. Integration with existing layout/routing
6. Brief usage documentation

EXISTING FILE STRUCTURE:
Frontend/
├── Components/
│   ├── MainComponents/
│   │   ├── Profile/
│   │   ├── Post/
│   │   ├── Messages/
│   │   ├── Notification/
│   │   └── [Feature]/
│   ├── Chat/
│   ├── Helper/
│   └── shared/
├── app/
│   └── (Main-body)/
│       └── [routes]/
├── lib/
│   ├── apollo-client.js
│   └── socket.js
└── store/
    └── [feature]Store.js

CONSTRAINTS:
- Do NOT modify existing working features
- Do NOT change backend APIs
- Do NOT create duplicate components (check existing first!)
- Use existing Apollo Client instance from lib/apollo-client.js
- Use existing Socket.IO instance from lib/socket.js
- Follow existing naming conventions
- Reuse existing UI components where possible
- Check for existing GraphQL queries before creating new ones
- Check for existing stores before creating new ones
- Extend existing components instead of duplicating

WORKFLOW:
1. READ the feature requirements
2. SEARCH for existing implementations
3. DECIDE: Enhance existing OR create new
4. IMPLEMENT with full documentation
5. TEST thoroughly
6. DOCUMENT what was created/enhanced

Begin implementation for: [FEATURE_NAME]
```

---

## 🚀 FEATURE-SPECIFIC PROMPTS

### 1️⃣ FOLLOW REQUEST SYSTEM (CRITICAL - Week 1)

```
FEATURE: Follow Request System for Private Profiles

BACKEND APIS AVAILABLE:

GraphQL Queries:
query GetFollowRequests {
  getFollowRequests {
    id
    fromProfileId
    toProfileId
    status
    createdAt
    fromProfile {
      profileid
      username
      name
      profilePic
      isVerified
    }
  }
}

query GetSentFollowRequests {
  getSentFollowRequests {
    id
    toProfileId
    status
    createdAt
    toProfile {
      profileid
      username
      name
      profilePic
      isPrivate
    }
  }
}

query GetFollowRequestStatus($toProfileId: ID!) {
  getFollowRequestStatus(toProfileId: $toProfileId) {
    status
    requestId
  }
}

GraphQL Mutations:
mutation SendFollowRequest($toProfileId: ID!) {
  SendFollowRequest(toProfileId: $toProfileId) {
    id
    status
    message
  }
}

mutation AcceptFollowRequest($requestId: ID!) {
  AcceptFollowRequest(requestId: $requestId) {
    success
    message
  }
}

mutation RejectFollowRequest($requestId: ID!) {
  RejectFollowRequest(requestId: $requestId) {
    success
    message
  }
}

mutation CancelFollowRequest($requestId: ID!) {
  CancelFollowRequest(requestId: $requestId) {
    success
    message
  }
}

COMPONENTS TO CREATE:

1. Components/MainComponents/Profile/FollowRequestButton.js
   - Smart button that shows: "Follow", "Requested", "Following", or "Request to Follow"
   - Handles click to send/cancel follow request
   - Shows loading state during API call
   - Optimistic UI updates
   - Integration point: ProfileHeader.js (already exists)

2. Components/MainComponents/Notification/FollowRequestNotifications.js
   - Shows incoming follow requests with Accept/Reject buttons
   - Real-time updates when new requests arrive
   - Optimistic UI for Accept/Reject actions
   - Integration point: NotificationCenter.js (already exists)

3. Components/MainComponents/Profile/FollowRequestsManager.js
   - Full page component showing:
     - Tab 1: Received Requests (with Accept/Reject)
     - Tab 2: Sent Requests (with Cancel option)
   - Empty states for both tabs
   - Loading skeletons
   - Pull-to-refresh on mobile

4. Components/Helper/FollowRequestBadge.js
   - Badge component showing unread follow request count
   - Real-time updates
   - Integration point: NotificationBell.js (already exists)

5. app/(Main-body)/follow-requests/page.js
   - Route page for full follow requests manager
   - Accessible from profile menu or notification center

REAL-TIME UPDATES:
- Use Socket.IO to receive real-time follow request events
- Events to listen for:
  - 'follow_request_received'
  - 'follow_request_accepted'
  - 'follow_request_rejected'
  - 'follow_request_cancelled'

STATE MANAGEMENT:
Create store/followRequestStore.js using zustand:
- receivedRequests: []
- sentRequests: []
- unreadCount: number
- actions: fetchRequests, addRequest, removeRequest, updateCount

UX REQUIREMENTS:
- Private profile badge should be visible on profile
- When visiting private profile → Show "Request to Follow" button
- After sending request → Button changes to "Requested" (grey)
- Can cancel from "Requested" state
- Notification bell shows badge with request count
- Smooth transitions between button states
- Toast notifications for all actions
- Confirmation dialog for rejecting requests

EDGE CASES TO HANDLE:
- Already following → Show "Following" button
- Request pending → Show "Requested" button
- Profile becomes public → Auto-convert to follow
- Request expires (if applicable)
- Network errors → Rollback optimistic updates

ERROR HANDLING:
- Network errors → Show retry option
- Already processed requests → Graceful message
- Profile not found → Navigate back with message
- Rate limiting → Show cooldown message

IMPLEMENTATION STEPS:
1. Create GraphQL queries file
2. Create zustand store
3. Build FollowRequestButton component
4. Build FollowRequestNotifications component
5. Build FollowRequestsManager full page
6. Add Socket.IO event listeners
7. Integrate with existing ProfileHeader
8. Integrate with existing NotificationCenter
9. Add route page
10. Test all flows

TESTING CHECKLIST:
- [ ] Send follow request to private profile
- [ ] See "Requested" state immediately
- [ ] Receive request on other account
- [ ] Accept request → See in followers
- [ ] Reject request → Request disappears
- [ ] Cancel sent request
- [ ] Badge count updates correctly
- [ ] Real-time updates work
- [ ] Optimistic UI works
- [ ] Error states work
- [ ] Mobile responsive
- [ ] Accessibility (keyboard navigation)

BEGIN IMPLEMENTATION.
```

---

### 2️⃣ NOTIFICATIONS SYSTEM (CRITICAL - Week 1)

```
FEATURE: Comprehensive Notifications System

BACKEND APIS AVAILABLE:

GraphQL Queries:
query GetNotifications($limit: Int, $offset: Int, $filter: NotificationFilter) {
  getNotifications(limit: $limit, offset: $offset, filter: $filter) {
    notifications {
      id
      type
      actorId
      targetId
      entityType
      entityId
      message
      isRead
      createdAt
      actor {
        profileid
        username
        name
        profilePic
        isVerified
      }
      metadata
    }
    hasMore
    total
  }
}

query GetUnreadNotificationCount {
  getUnreadNotificationCount
}

GraphQL Mutations:
mutation MarkNotificationAsRead($notificationId: ID!) {
  MarkNotificationAsRead(notificationId: $notificationId) {
    success
  }
}

mutation MarkAllNotificationsAsRead {
  MarkAllNotificationsAsRead {
    success
    count
  }
}

mutation DeleteNotification($notificationId: ID!) {
  DeleteNotification(notificationId: $notificationId) {
    success
  }
}

NOTIFICATION TYPES:
- FOLLOW: "User X started following you"
- FOLLOW_REQUEST: "User X requested to follow you"
- LIKE: "User X liked your post"
- COMMENT: "User X commented on your post"
- REPLY: "User X replied to your comment"
- MENTION: "User X mentioned you in a post/comment"
- TAG: "User X tagged you in a post"
- STORY_VIEW: "User X viewed your story"
- MESSAGE: "User X sent you a message"
- CALL: "User X is calling you" or "Missed call from User X"

COMPONENTS TO CREATE:

1. Components/MainComponents/Notification/NotificationCenter.js (ENHANCE EXISTING)
   - Full notification list with infinite scroll
   - Filter tabs: All, Mentions, Likes, Comments, Follows
   - Mark all as read button
   - Individual notification cards
   - Real-time new notification animations
   - Pull-to-refresh
   - Empty state

2. Components/MainComponents/Notification/NotificationBell.js (ENHANCE EXISTING)
   - Bell icon with badge count
   - Dropdown showing recent 10 notifications
   - "See all" link to NotificationCenter
   - Real-time badge updates
   - Desktop: Dropdown menu
   - Mobile: Navigates to full page

3. Components/MainComponents/Notification/NotificationItem.js
   - Single notification card
   - Different layouts per type (follow, like, comment, etc.)
   - Actor profile picture
   - Clickable → Navigate to relevant content
   - Swipe-to-delete on mobile
   - Mark as read on view
   - Time ago format

4. Components/MainComponents/Notification/NotificationFilters.js
   - Tab bar for filtering notifications
   - Active state styling
   - Count badges per filter

5. Components/Helper/NotificationBadge.js
   - Reusable badge component
   - Animated count updates
   - Max display (99+)

6. app/(Main-body)/notifications/page.js
   - Full page notification center
   - Server-side initial load
   - Client-side real-time updates

REAL-TIME UPDATES:
Socket.IO Events:
- Listen for: 'notification_received'
- Emit: 'mark_notification_read'
- Auto-update badge count
- Show toast for important notifications

STATE MANAGEMENT:
Create store/notificationStore.js:
- notifications: []
- unreadCount: number
- filter: 'all' | 'mentions' | 'likes' | 'comments' | 'follows'
- hasMore: boolean
- actions: fetchNotifications, markAsRead, markAllAsRead, deleteNotification, addNotification

UX REQUIREMENTS:
- Badge shows on bell icon (max 99+)
- Red dot for unread
- Clicking notification marks as read
- Smooth scroll to content on click
- Group similar notifications ("User X and 5 others liked your post")
- Show profile pictures in stack for grouped notifications
- Haptic feedback on mobile
- Sound notification (optional, user setting)

NOTIFICATION ACTIONS:
- Follow notification → Navigate to their profile
- Like notification → Navigate to post
- Comment notification → Navigate to post + open comments
- Mention notification → Navigate to content + highlight mention
- Follow request → Show Accept/Reject buttons inline
- Message notification → Navigate to chat

DESIGN PATTERNS:
- Instagram-style notification list
- Unread notifications have blue dot
- Read notifications are dimmed
- Time shown as "2h ago", "3d ago", etc.
- Smooth fade-in for new notifications
- Loading skeleton while fetching

ERROR HANDLING:
- Failed to load → Retry button
- Failed to mark as read → Retry silently
- Network offline → Show cached notifications
- Empty state with friendly message

PERFORMANCE:
- Infinite scroll pagination (20 per page)
- Virtual scrolling for large lists
- Debounce mark-as-read API calls
- Cache notifications locally
- Optimistic updates

IMPLEMENTATION STEPS:
1. Create GraphQL queries/mutations
2. Create zustand store
3. Enhance NotificationBell with badge
4. Build NotificationItem components
5. Build NotificationCenter full page
6. Add Socket.IO listeners
7. Implement infinite scroll
8. Add pull-to-refresh
9. Implement filters
10. Add swipe-to-delete
11. Add click navigation logic
12. Test all notification types

TESTING CHECKLIST:
- [ ] Badge shows correct count
- [ ] Real-time updates work
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Delete notification works
- [ ] Click navigation works correctly per type
- [ ] Infinite scroll works
- [ ] Pull-to-refresh works
- [ ] Filters work
- [ ] Empty states show
- [ ] Loading states work
- [ ] Mobile responsive
- [ ] Swipe-to-delete works
- [ ] Grouped notifications display correctly

BEGIN IMPLEMENTATION.
```

---

### 3️⃣ TRENDING & HASHTAG PAGES (Week 2)

```
FEATURE: Trending Posts, Hashtag Pages, and Post Analytics

BACKEND APIS AVAILABLE:

GraphQL Queries:
query GetTrendingPosts($timeRange: TimeRange, $limit: Int) {
  getTrendingPosts(timeRange: $timeRange, limit: $limit) {
    postid
    content
    images
    video
    engagement {
      likes
      comments
      shares
      views
    }
    trendingScore
    creator {
      profileid
      username
      name
      profilePic
      isVerified
    }
    createdAt
  }
}

query GetPostsByHashtag($hashtag: String!, $limit: Int, $cursor: String) {
  getPostsByHashtag(hashtag: $hashtag, limit: $limit, cursor: $cursor) {
    posts {
      postid
      content
      images
      video
      engagement {
        likes
        comments
        shares
      }
      creator {
        profileid
        username
        profilePic
        isVerified
      }
      createdAt
    }
    hasMore
    nextCursor
    hashtagStats {
      totalPosts
      totalViews
      trending
    }
  }
}

query GetPostStats($postId: ID!) {
  getPostStats(postId: $postId) {
    likes
    comments
    shares
    views
    saves
    reach
    engagement
    hourlyViews {
      hour
      views
    }
    topLocations {
      country
      count
    }
    demographics {
      ageRange
      percentage
    }
  }
}

query SearchPosts($query: String!, $filters: PostSearchFilters) {
  searchPosts(query: $query, filters: $filters) {
    posts {
      postid
      content
      images
      video
      creator {
        profileid
        username
        profilePic
      }
      createdAt
    }
    total
    hasMore
  }
}

GraphQL Mutations:
mutation SharePost($postId: ID!, $platform: SharePlatform, $message: String) {
  SharePost(postId: $postId, platform: $platform, message: $message) {
    success
    shareUrl
  }
}

mutation ReportPost($postId: ID!, $reason: ReportReason!, $details: String) {
  ReportPost(postId: $postId, reason: $reason, details: $details) {
    success
    reportId
  }
}

COMPONENTS TO CREATE:

1. app/(Main-body)/explore/page.js
   - Explore/Trending page
   - Tabs: Trending, For You, Recent
   - Time range selector (24h, 7d, 30d, All time)
   - Grid layout for posts
   - Infinite scroll

2. app/(Main-body)/explore/hashtag/[hashtag]/page.js
   - Hashtag detail page
   - Hashtag statistics at top
   - Filter: Top, Recent
   - Grid layout for posts
   - Follow hashtag button (if backend supports)

3. Components/MainComponents/Explore/TrendingGrid.js
   - Masonry grid layout for posts
   - Hover preview (desktop)
   - Tap preview (mobile)
   - Post overlay with stats
   - "Trending" badge for hot posts

4. Components/MainComponents/Explore/HashtagHeader.js
   - Hashtag name with #
   - Total posts count
   - Trending indicator
   - Follow button
   - Description (if available)

5. Components/MainComponents/Post/PostAnalytics.js
   - Full analytics view for creator's own posts
   - Charts for views over time
   - Engagement breakdown
   - Reach statistics
   - Demographics data
   - Export data option

6. Components/MainComponents/Post/ShareModal.js
   - Modal for sharing posts
   - Share to: Instagram, Twitter, Facebook, WhatsApp
   - Copy link button
   - Share to Swaggo users (DM)
   - Custom message option

7. Components/MainComponents/Post/ReportModal.js
   - Modal for reporting posts
   - Reason selection (Spam, Harassment, Violence, etc.)
   - Details textarea
   - Submit button
   - Confirmation screen

8. Components/MainComponents/Search/AdvancedPostSearch.js
   - Search bar with filters
   - Filters: Date range, User, Hashtags, Media type
   - Search results grid
   - Search history

FEATURES TO IMPLEMENT:

A. Explore/Trending Page:
- Show trending posts based on engagement
- Time range selector (Last 24h, 7d, 30d)
- Smooth grid layout
- Click post → Open modal
- Infinite scroll

B. Hashtag Pages:
- Extract hashtags from post content
- Make hashtags clickable
- Navigate to hashtag page
- Show all posts with that hashtag
- Display hashtag statistics

C. Post Analytics (For Own Posts):
- Access from post menu (... button)
- "View Insights" option
- Show detailed metrics
- Charts and graphs
- Export option

D. Share Functionality:
- Share button on every post
- Native share API integration
- Social media sharing
- Copy link
- Share via DM within app

E. Report Functionality:
- Report button in post menu
- Report modal with reasons
- Submit report
- Confirmation message
- Hide post after reporting

STATE MANAGEMENT:
Create stores:
- store/exploreStore.js (trending posts, time range)
- store/hashtagStore.js (hashtag data, posts)
- store/searchStore.js (search history, filters)

UX REQUIREMENTS:
- Instagram Explore-style grid
- Smooth transitions
- Loading skeletons
- Empty states ("No posts yet")
- Pull-to-refresh
- Share sheet animation
- Report confirmation

DESIGN PATTERNS:
- Grid layout: 3 columns desktop, 3 columns mobile
- Post overlay on hover (desktop)
- Post preview modal
- Sticky time range selector
- Floating action buttons
- Bottom sheet modals (mobile)

IMPLEMENTATION STEPS:
1. Create Explore page with trending posts
2. Implement grid layout component
3. Add time range filtering
4. Create hashtag detail page
5. Make hashtags clickable throughout app
6. Build PostAnalytics component
7. Build ShareModal component
8. Build ReportModal component
9. Integrate share/report with existing posts
10. Add advanced search functionality
11. Test all flows

TESTING CHECKLIST:
- [ ] Trending posts load correctly
- [ ] Time range filter works
- [ ] Hashtag page shows correct posts
- [ ] Hashtags are clickable
- [ ] Analytics show for own posts
- [ ] Share modal opens
- [ ] Share to platforms works
- [ ] Copy link works
- [ ] Report modal opens
- [ ] Report submission works
- [ ] Post hidden after report
- [ ] Search works with filters
- [ ] Infinite scroll works
- [ ] Grid layout responsive
- [ ] Mobile optimized

BEGIN IMPLEMENTATION.
```

---

### 4️⃣ STORY HIGHLIGHTS (Week 2-3)

```
FEATURE: Story Highlights Management

BACKEND APIS AVAILABLE:

GraphQL Queries:
query GetUserHighlights($profileId: ID!) {
  getUserHighlights(profileId: $profileId) {
    highlightid
    name
    coverImage
    storiesCount
    createdAt
    stories {
      storyid
      type
      url
      thumbnail
      duration
      createdAt
    }
  }
}

query GetHighlightById($highlightId: ID!) {
  getHighlightById(highlightId: $highlightId) {
    highlightid
    name
    coverImage
    stories {
      storyid
      type
      url
      thumbnail
      caption
      duration
      createdAt
    }
    creator {
      profileid
      username
      profilePic
    }
  }
}

GraphQL Mutations:
mutation CreateHighlightWithStories($name: String!, $storyIds: [ID!]!, $coverImage: String) {
  createHighlightWithStories(name: $name, storyIds: $storyIds, coverImage: $coverImage) {
    highlightid
    name
    coverImage
    storiesCount
  }
}

mutation AddStoryToHighlight($highlightId: ID!, $storyId: ID!) {
  addStoryToHighlight(highlightId: $highlightId, storyId: $storyId) {
    success
  }
}

mutation RemoveStoryFromHighlight($highlightId: ID!, $storyId: ID!) {
  removeStoryFromHighlight(highlightId: $highlightId, storyId: $storyId) {
    success
  }
}

mutation DeleteHighlight($highlightId: ID!) {
  deleteHighlight(highlightId: $highlightId) {
    success
  }
}

mutation UpdateHighlight($highlightId: ID!, $name: String, $coverImage: String) {
  updateHighlight(highlightId: $highlightId, name: $name, coverImage: $coverImage) {
    highlightid
    name
    coverImage
  }
}

COMPONENTS TO CREATE:

1. Components/MainComponents/Profile/HighlightsSection.js (ENHANCE EXISTING)
   - Horizontal scroll of highlight circles
   - Click to view highlight stories
   - Long press (mobile) or right-click (desktop) to edit (own profile)
   - Add new highlight button (+ circle)
   - Empty state for no highlights

2. Components/MainComponents/Story/HighlightViewer.js
   - Full-screen story viewer for highlights
   - Swipe/arrow navigation between stories
   - Progress bars for each story
   - Tap left/right for prev/next
   - Hold to pause
   - Story info overlay
   - Exit button

3. Components/MainComponents/Story/CreateHighlightModal.js
   - Modal to create new highlight
   - Name input
   - Select expired stories to add
   - Choose cover image from selected stories
   - Preview
   - Create button

4. Components/MainComponents/Story/EditHighlightModal.js
   - Edit highlight name
   - Add more stories
   - Remove stories
   - Change cover image
   - Delete highlight option
   - Save changes button

5. Components/MainComponents/Story/HighlightCoverSelector.js
   - Grid of story thumbnails from highlight
   - Select one as cover
   - Highlight selected
   - Cancel/Confirm buttons

6. Components/MainComponents/Story/ExpiredStoriesSelector.js
   - Grid of user's expired stories (>24h old)
   - Multi-select checkboxes
   - Search/filter by date
   - Selected count
   - Add to highlight button

7. Components/Helper/HighlightCircle.js
   - Reusable highlight circle component
   - Cover image
   - Name below
   - Optional edit icon overlay
   - Loading state

FEATURES TO IMPLEMENT:

A. View Highlights:
- Click highlight circle → Open viewer
- Full-screen story viewer
- Navigate between stories
- Auto-advance after duration
- Progress bars
- Story counter (1/10)

B. Create Highlight:
- "+" button in highlights section
- Select expired stories
- Enter highlight name
- Choose cover image
- Create highlight

C. Edit Highlight:
- Long press highlight circle (own profile)
- Edit name
- Add more stories
- Remove stories
- Change cover
- Delete highlight

D. Highlight Settings:
- Reorder highlights
- Archive highlights
- Unarchive highlights
- Privacy settings (if supported)

STATE MANAGEMENT:
Create store/highlightStore.js:
- highlights: []
- currentHighlight: null
- currentStoryIndex: number
- isPlaying: boolean
- actions: fetchHighlights, createHighlight, updateHighlight, deleteHighlight

UX REQUIREMENTS:
- Instagram-style highlight circles
- Smooth viewer transitions
- Auto-play stories in sequence
- Touch gestures (swipe, tap, hold)
- Keyboard navigation (arrow keys, space)
- Loading states
- Empty states
- Confirmation dialogs

DESIGN PATTERNS:
- Circular thumbnails (border gradient if new)
- Name below circle (truncated)
- Full-screen viewer (black background)
- Progress bars at top
- Story counter
- Smooth fade transitions
- Bottom sheet modals

GESTURES & INTERACTIONS:
- Tap left half → Previous story
- Tap right half → Next story
- Hold → Pause
- Swipe down → Exit viewer
- Swipe left/right → Next/previous story
- Long press circle → Edit menu

IMPLEMENTATION STEPS:
1. Enhance HighlightsSection on profile
2. Build HighlightViewer component
3. Implement story navigation logic
4. Build CreateHighlightModal
5. Build EditHighlightModal
6. Build cover selector
7. Build expired stories selector
8. Add long press/right-click menu
9. Integrate with profile page
10. Add keyboard shortcuts
11. Test all gestures
12. Mobile optimization

TESTING CHECKLIST:
- [ ] Highlights display on profile
- [ ] Click highlight opens viewer
- [ ] Stories auto-advance
- [ ] Tap left/right navigation works
- [ ] Hold to pause works
- [ ] Progress bars accurate
- [ ] Create highlight flow works
- [ ] Edit highlight flow works
- [ ] Delete highlight works
- [ ] Cover selection works
- [ ] Expired stories load correctly
- [ ] Long press menu works
- [ ] Keyboard navigation works
- [ ] Mobile gestures work
- [ ] Smooth animations
- [ ] Loading states work

BEGIN IMPLEMENTATION.
```

---

### 5️⃣ FEATURE FLAGS SYSTEM (Week 3)

```
FEATURE: Feature Flags System with Admin Panel

BACKEND APIS AVAILABLE:

REST Endpoints:
POST   /api/feature-flags/create
  - Create new feature flag
  - Body: { name: "enable_stories", enabled: true, description: "...", rolloutPercentage: 100 }
  - Returns: { flagId, name, enabled, rolloutPercentage }

GET    /api/feature-flags/all
  - List all feature flags
  - Query: ?category=features|experiments
  - Returns: [{ flagId, name, enabled, rolloutPercentage, description }]

GET    /api/feature-flags/:flagId
  - Get specific flag details
  - Returns: { flagId, name, enabled, users, rolloutPercentage, createdAt, updatedAt }

PUT    /api/feature-flags/:flagId/update
  - Update flag settings
  - Body: { enabled: false, rolloutPercentage: 50 }
  - Returns: { success, flag }

DELETE /api/feature-flags/:flagId/delete
  - Delete feature flag
  - Returns: { success }

POST   /api/feature-flags/:flagId/enable-for-user
  - Enable flag for specific user (whitelist)
  - Body: { userId: "12345" }
  - Returns: { success }

GET    /api/feature-flags/:flagId/check
  - Check if flag is enabled for current user
  - Returns: { enabled: true }

COMPONENTS TO CREATE:

1. app/(Main-body)/admin/feature-flags/page.js
   - Admin page for managing feature flags
   - Table/list of all flags
   - Toggle switches for enable/disable
   - Create new flag button
   - Edit flag button
   - Delete flag confirmation
   - Filter by category
   - Search flags

2. Components/Admin/FeatureFlags/FeatureFlagTable.js
   - Table displaying all feature flags
   - Columns: Name, Description, Status, Rollout %, Actions
   - Inline toggle for enable/disable
   - Quick actions: Edit, Delete, View Users
   - Sorting by name, status, date
   - Pagination

3. Components/Admin/FeatureFlags/CreateFeatureFlagModal.js
   - Modal to create new feature flag
   - Flag name input (unique identifier)
   - Display name input
   - Description textarea
   - Enabled toggle (default: false)
   - Rollout percentage slider (0-100%)
   - Category selector (features, experiments, settings)
   - Target audience selector
   - Create button

4. Components/Admin/FeatureFlags/EditFeatureFlagModal.js
   - Edit existing flag
   - Update name, description
   - Toggle enabled status
   - Adjust rollout percentage
   - View users with flag enabled
   - Add/remove users from whitelist
   - Save changes button
   - Delete flag option

5. Components/Admin/FeatureFlags/FeatureFlagToggle.js
   - Reusable toggle switch component
   - Shows current state (on/off)
   - Animated transition
   - Loading state during API call
   - Optimistic update
   - Rollback on error

6. Components/Admin/FeatureFlags/RolloutPercentageSlider.js
   - Visual slider for rollout percentage
   - Shows percentage value
   - Estimated users affected
   - Quick presets (0%, 25%, 50%, 75%, 100%)
   - Real-time preview

7. Components/Admin/FeatureFlags/UserWhitelistManager.js
   - Manage user whitelist for flag
   - Search users by username
   - Add user to whitelist
   - Remove user from whitelist
   - Show current whitelisted users
   - Bulk actions

8. Components/Helper/FeatureFlagGuard.js
   - HOC/Component to wrap features behind flags
   - Usage: <FeatureFlagGuard flag="enable_stories">...</FeatureFlagGuard>
   - Shows children only if flag enabled
   - Shows fallback UI if disabled
   - Checks user-specific flags
   - Real-time flag updates

9. lib/hooks/useFeatureFlag.js
   - Custom hook to check feature flags
   - Usage: const isEnabled = useFeatureFlag('enable_stories')
   - Checks global flag status
   - Checks user-specific override
   - Caches flag values
   - Real-time updates

10. Components/Admin/FeatureFlags/FeatureFlagAnalytics.js
    - Analytics dashboard for flag usage
    - How many users have flag enabled
    - Adoption rate over time
    - A/B test results (if applicable)
    - User engagement metrics

FEATURES TO IMPLEMENT:

A. Admin Panel:
- Protected admin route (role-based access)
- List all feature flags
- Create new flags
- Edit existing flags
- Delete flags with confirmation
- Toggle flags on/off
- Adjust rollout percentage

B. Flag Management:
- Real-time flag updates (Socket.IO)
- Gradual rollout (percentage-based)
- User whitelisting
- A/B testing support
- Flag inheritance/dependencies
- Flag expiration dates

C. Frontend Integration:
- FeatureFlagGuard component
- useFeatureFlag hook
- Wrap new features with guards
- Hide/show UI elements based on flags
- Client-side flag caching
- Real-time flag sync

D. Analytics:
- Track flag usage
- User adoption metrics
- Performance impact
- A/B test results

STATE MANAGEMENT:
Create store/featureFlagStore.js:
- flags: { flagName: { enabled, rollout, users } }
- userFlags: { flagName: boolean }
- isLoading: boolean
- actions: fetchFlags, toggleFlag, checkFlag, updateRollout

UX REQUIREMENTS:
- Admin panel protected by authentication
- Only admins can manage flags
- Clear visual indicators (on/off states)
- Confirmation before destructive actions
- Toast notifications for all actions
- Loading states
- Error handling
- Real-time updates

DESIGN PATTERNS:
- Clean admin dashboard
- Table with inline actions
- Modals for create/edit
- Toggle switches (iOS-style)
- Slider for rollout percentage
- Color coding (green=on, grey=off)
- Badge for rollout percentage

REAL-TIME UPDATES:
Socket.IO Events:
- Listen for: 'feature_flag_updated'
- Emit: 'request_flag_status'
- Auto-update UI when flags change
- Show notification when flag changes

SECURITY:
- Role-based access control
- Only admins can modify flags
- Regular users can only check flags
- Audit log for flag changes
- Rate limiting on flag checks

USE CASES:

1. Gradual Feature Rollout:
   - Deploy new "Reels" feature
   - Start at 1% of users
   - Monitor for bugs
   - Gradually increase to 100%

2. A/B Testing:
   - Test "Like" vs "Favorite" button
   - 50% see Like, 50% see Favorite
   - Track engagement metrics
   - Roll out winner

3. Emergency Kill Switch:
   - New feature has critical bug
   - Admin toggles flag off
   - Feature disabled instantly
   - Fix bug at own pace
   - Re-enable when ready

4. Beta Access:
   - Enable flag for specific beta testers
   - Whitelist users
   - Get feedback
   - Roll out to all

5. Regional Rollout:
   - Enable "Shopping" for USA first
   - Then Europe
   - Then Asia
   - Based on location/country

IMPLEMENTATION STEPS:
1. Create admin page route
2. Build FeatureFlagTable component
3. Build CreateFeatureFlagModal
4. Build EditFeatureFlagModal
5. Build toggle and slider components
6. Build UserWhitelistManager
7. Create FeatureFlagGuard HOC
8. Create useFeatureFlag hook
9. Integrate Socket.IO for real-time updates
10. Add role-based access control
11. Create zustand store
12. Add analytics dashboard
13. Test all flows
14. Document flag usage for developers

EXAMPLE USAGE IN CODE:

```jsx
// Method 1: Component Guard
import { FeatureFlagGuard } from '@/components/Helper/FeatureFlagGuard'

function ProfilePage() {
  return (
    <div>
      <ProfileHeader />
      
      <FeatureFlagGuard flag="enable_stories">
        <StoriesSection />
      </FeatureFlagGuard>
      
      <FeatureFlagGuard flag="enable_reels" fallback={<ComingSoonBanner />}>
        <ReelsSection />
      </FeatureFlagGuard>
    </div>
  )
}

// Method 2: Hook
import { useFeatureFlag } from '@/lib/hooks/useFeatureFlag'

function CreatePost() {
  const canSchedulePosts = useFeatureFlag('enable_scheduled_posts')
  
  return (
    <div>
      <PostEditor />
      {canSchedulePosts && <ScheduleButton />}
    </div>
  )
}
```

TESTING CHECKLIST:
- [ ] Admin can create feature flag
- [ ] Admin can edit feature flag
- [ ] Admin can delete feature flag
- [ ] Toggle switch enables/disables flag
- [ ] Rollout percentage updates correctly
- [ ] User whitelist works
- [ ] FeatureFlagGuard shows/hides content
- [ ] useFeatureFlag hook returns correct value
- [ ] Real-time updates work
- [ ] Non-admin users cannot access admin panel
- [ ] Flags persist after page reload
- [ ] Analytics show correct metrics
- [ ] Mobile responsive
- [ ] Error handling works

BEGIN IMPLEMENTATION.
```

---

### 6️⃣ MESSAGE TEMPLATES (Quick Replies) (Week 4)

```
FEATURE: Message Templates (Quick Replies) for Chat

BACKEND APIS AVAILABLE:

REST Endpoints:
POST   /api/message-templates/create
  - Create new template
  - Body: { name: "Greeting", content: "Hi! How can I help?", category: "business" }
  - Returns: { templateId, name, content }

GET    /api/message-templates/user/:userId
  - Get all templates for user
  - Returns: [{ id: "1", name: "Greeting", content: "...", timesUsed: 42 }]

GET    /api/message-templates/:templateId
  - Get specific template
  - Returns: { name: "...", content: "...", category, createdAt }

PUT    /api/message-templates/:templateId/update
  - Update template
  - Body: { name: "Updated Name", content: "New text" }
  - Returns: { success, template }

DELETE /api/message-templates/:templateId/delete
  - Delete template
  - Returns: { success }

POST   /api/message-templates/:templateId/use
  - Track template usage (analytics)
  - Returns: { timesUsed: 43 }

GET    /api/message-templates/popular
  - Get most-used templates (community)
  - Returns: [{ name: "Thanks!", timesUsed: 1000, isPublic: true }]

POST   /api/message-templates/:templateId/share
  - Share template with other users
  - Body: { shareWithUserId: "789" }
  - Returns: { success, shareUrl }

COMPONENTS TO CREATE:

1. Components/Chat/Messaging/TemplatePickerButton.js
   - Button to open template picker
   - Icon showing template count
   - Located next to message input
   - Opens template picker modal/dropdown
   - Keyboard shortcut: Cmd+K or Ctrl+K

2. Components/Chat/Messaging/TemplatePickerModal.js
   - Modal/Dropdown showing all templates
   - Search/filter templates by name
   - Category tabs (All, Business, Personal, Custom)
   - Template preview on hover
   - Click template to insert into message input
   - "Create New Template" button at top
   - Recently used templates section
   - Popular templates section

3. Components/Chat/Settings/TemplateManager.js
   - Full page template management
   - List all user's templates
   - Create new template
   - Edit existing template
   - Delete template (with confirmation)
   - Organize by category
   - Usage statistics per template
   - Import/Export templates

4. Components/Chat/Messaging/CreateTemplateModal.js
   - Modal to create new template
   - Template name input
   - Template content textarea (supports rich text)
   - Category selector
   - Preview section
   - Variable placeholders ({{name}}, {{date}}, etc.)
   - Save as private/public toggle
   - Keyboard shortcuts guide
   - Create button

5. Components/Chat/Messaging/EditTemplateModal.js
   - Edit template name
   - Edit template content
   - Change category
   - View usage statistics
   - Duplicate template option
   - Delete template option
   - Save changes button

6. Components/Chat/Messaging/TemplateCard.js
   - Single template card in list
   - Template name
   - Content preview (truncated)
   - Category badge
   - Times used counter
   - Last used date
   - Quick actions: Use, Edit, Delete
   - Click to insert into message

7. Components/Chat/Messaging/TemplateVariableInserter.js
   - Dropdown to insert variables
   - Available variables:
     * {{username}} - Recipient's username
     * {{name}} - Recipient's display name
     * {{date}} - Current date
     * {{time}} - Current time
     * {{day}} - Day of week
   - Custom variable creator
   - Preview with replaced values

8. Components/Chat/Messaging/PopularTemplatesSection.js
   - Shows popular/trending templates
   - Templates from other users (public)
   - One-click to save to own templates
   - Sorted by usage count
   - Category filter
   - Search functionality

9. Components/Chat/Settings/TemplateImportExport.js
   - Export templates as JSON
   - Import templates from JSON
   - Backup templates
   - Share template pack with team
   - Merge templates from import

10. lib/hooks/useMessageTemplates.js
    - Custom hook for template operations
    - fetchTemplates()
    - insertTemplate(templateId, messageInput)
    - createTemplate(data)
    - updateTemplate(id, data)
    - deleteTemplate(id)
    - searchTemplates(query)

FEATURES TO IMPLEMENT:

A. Template Picker:
- Button next to message input
- Opens modal/dropdown
- Search templates
- Click to insert into message
- Recently used at top
- Keyboard shortcut (Cmd+K)

B. Template Management:
- Create new templates
- Edit existing templates
- Delete templates
- Organize by category
- View usage statistics
- Export/Import templates

C. Template Variables:
- {{username}} auto-replaced
- {{name}} auto-replaced
- {{date}}, {{time}} auto-replaced
- Custom variables
- Preview with replaced values

D. Quick Insertion:
- Type "/" in message input
- Shows template suggestions
- Arrow keys to select
- Enter to insert
- Like Slack slash commands

E. Popular Templates:
- Browse community templates
- Save to own collection
- Rate templates
- Share templates

F. Business Features:
- Categories: Greetings, FAQs, Closing, Custom
- Usage analytics
- Team templates (for business accounts)
- Template approval workflow

STATE MANAGEMENT:
Create store/messageTemplateStore.js:
- templates: []
- recentTemplates: []
- popularTemplates: []
- categories: []
- isLoading: boolean
- actions: fetchTemplates, createTemplate, updateTemplate, deleteTemplate, insertTemplate

UX REQUIREMENTS:
- Easy access from message input
- Fast template insertion (<1 second)
- Search with instant results
- Keyboard shortcuts
- Preview before inserting
- Variable replacement visible
- Mobile-friendly picker
- Smooth animations

DESIGN PATTERNS:
- WhatsApp Business style
- Template picker: Dropdown or bottom sheet
- Template card: Name + preview + actions
- Category tabs
- Search bar at top
- Recently used section
- Quick action buttons

KEYBOARD SHORTCUTS:
- Cmd+K / Ctrl+K: Open template picker
- /: Start template search in message input
- Arrow keys: Navigate templates
- Enter: Insert selected template
- Esc: Close picker

INTEGRATION POINTS:

1. Message Input:
   - Add template button next to send
   - Detect "/" prefix for slash commands
   - Replace variables on insert

2. Chat Settings:
   - "Message Templates" menu item
   - Opens template manager

3. Profile Settings:
   - Global template management
   - Import/Export options

USE CASES:

1. Business Support:
   - Customer: "When will my order ship?"
   - Agent: Opens templates → Selects "Shipping Info"
   - Message: "Your order will ship within 24 hours. Tracking: [link]"

2. Influencer DMs:
   - Fan: "Love your content!"
   - Creator: Opens templates → Selects "Thank You"
   - Message: "Thanks for your support! 💕 Check my latest post!"

3. Team Communication:
   - Manager: Needs to send meeting link
   - Types: /meeting
   - Auto-suggests: "Daily Standup" template
   - Message: "Join our daily standup: zoom.us/..."

4. Quick Greetings:
   - User: Opens chat
   - Clicks template button
   - Selects "Good Morning"
   - Message: "Good morning! Hope you're having a great day!"

IMPLEMENTATION STEPS:
1. Create template picker button in message input
2. Build TemplatePickerModal component
3. Build CreateTemplateModal component
4. Build TemplateManager page
5. Build EditTemplateModal component
6. Implement template variable replacement
7. Add slash command detection (/)
8. Build popular templates section
9. Add keyboard shortcuts
10. Integrate with message input
11. Add usage tracking
12. Create zustand store
13. Test all flows
14. Mobile optimization

EXAMPLE USAGE:

```jsx
// Message Input Component
import { TemplatePickerButton } from '@/components/Chat/Messaging/TemplatePickerButton'

function MessageInput() {
  const [message, setMessage] = useState('')
  const { insertTemplate } = useMessageTemplates()
  
  const handleTemplateSelect = (template) => {
    const replacedContent = replaceVariables(template.content, {
      username: currentChat.username,
      name: currentChat.name,
      date: new Date().toLocaleDateString()
    })
    setMessage(replacedContent)
  }
  
  return (
    <div>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} />
      <TemplatePickerButton onSelect={handleTemplateSelect} />
      <SendButton />
    </div>
  )
}
```

TESTING CHECKLIST:
- [ ] Template picker opens from button
- [ ] Search templates works
- [ ] Click template inserts into message
- [ ] Variables are replaced correctly
- [ ] Create template works
- [ ] Edit template works
- [ ] Delete template works
- [ ] Slash commands work (/)
- [ ] Keyboard shortcuts work (Cmd+K)
- [ ] Recently used templates appear
- [ ] Popular templates load
- [ ] Usage tracking works
- [ ] Categories filter correctly
- [ ] Export/Import works
- [ ] Mobile responsive

BEGIN IMPLEMENTATION.
```

---

### 7️⃣ SCHEDULED MESSAGES (Week 4)

```
FEATURE: Scheduled Messages for Chat

BACKEND APIS AVAILABLE:

GraphQL Queries:
query GetScheduledMessagesByChat($chatId: ID!) {
  getScheduledMessagesByChat(chatId: $chatId) {
    scheduledMessageId
    chatId
    senderId
    content
    attachments
    scheduledFor
    status
    createdAt
    sender {
      profileid
      username
      profilePic
    }
  }
}

query GetScheduledMessage($scheduledMessageId: ID!) {
  getScheduledMessage(scheduledMessageId: $scheduledMessageId) {
    scheduledMessageId
    chatId
    content
    attachments
    scheduledFor
    status
    createdAt
  }
}

GraphQL Mutations:
mutation CreateScheduledMessage($chatId: ID!, $content: String!, $scheduledFor: DateTime!, $attachments: [String]) {
  createScheduledMessage(chatId: $chatId, content: $content, scheduledFor: $scheduledFor, attachments: $attachments) {
    scheduledMessageId
    scheduledFor
  }
}

mutation UpdateScheduledMessage($scheduledMessageId: ID!, $content: String, $scheduledFor: DateTime) {
  updateScheduledMessage(scheduledMessageId: $scheduledMessageId, content: $content, scheduledFor: $scheduledFor) {
    scheduledMessageId
    scheduledFor
  }
}

mutation DeleteScheduledMessage($scheduledMessageId: ID!) {
  deleteScheduledMessage(scheduledMessageId: $scheduledMessageId) {
    success
  }
}

mutation SendScheduledMessageNow($scheduledMessageId: ID!) {
  sendScheduledMessageNow(scheduledMessageId: $scheduledMessageId) {
    success
    messageId
  }
}

COMPONENTS TO CREATE:

1. Components/Chat/Settings/ScheduledMessagesPanel.js
   - List of scheduled messages for current chat
   - Filter: Upcoming, Sent, Failed
   - Sort by date
   - Edit/Delete actions
   - Send now option
   - Empty state

2. Components/Chat/Messaging/ScheduleMessageModal.js
   - Modal to schedule a message
   - Message input (supports existing message editor)
   - Date picker
   - Time picker
   - Timezone display
   - Schedule button
   - Preview

3. Components/Chat/Messaging/ScheduledMessageItem.js
   - Single scheduled message card
   - Message preview (truncated)
   - Scheduled time
   - Status badge (Pending, Sent, Failed)
   - Edit/Delete/Send Now buttons
   - Expandable for full message

4. Components/Chat/Messaging/EditScheduledMessageModal.js
   - Edit message content
   - Edit scheduled time
   - Save changes button
   - Cancel button

5. Components/Helper/DateTimePicker.js
   - Reusable date/time picker
   - Calendar view
   - Time selector
   - Timezone info
   - Minimum time validation (can't schedule in past)
   - User-friendly interface

6. Components/Chat/Messaging/ScheduledMessageIndicator.js
   - Small badge/icon in message input area
   - Shows count of scheduled messages
   - Click to open scheduled messages panel

FEATURES TO IMPLEMENT:

A. Schedule Message:
- Long press send button → Show "Schedule" option
- Open schedule modal
- Select date and time
- Confirm schedule
- Show confirmation toast

B. View Scheduled:
- Access from chat menu (... button)
- "Scheduled Messages" option
- List all scheduled messages
- See status and time
- Countdown to send time

C. Edit Scheduled:
- Click scheduled message
- Edit content
- Edit time
- Save changes
- Update confirmation

D. Delete Scheduled:
- Swipe to delete (mobile)
- Delete button (desktop)
- Confirmation dialog
- Remove from list

E. Send Now:
- "Send Now" button
- Confirmation dialog
- Immediate send
- Update status

F. Failed Messages:
- Show failed scheduled messages
- Reason for failure
- Retry option
- Delete option

STATE MANAGEMENT:
Create store/scheduledMessageStore.js:
- scheduledMessages: []
- filter: 'upcoming' | 'sent' | 'failed'
- actions: fetchScheduled, createScheduled, updateScheduled, deleteScheduled, sendNow

UX REQUIREMENTS:
- Easy to schedule from message input
- Clear visual indicator of scheduled messages
- Countdown timer to send time
- Confirmation before sending now
- Error handling for failed sends
- Notification when message is sent
- Timezone awareness

DESIGN PATTERNS:
- Bottom sheet for schedule modal (mobile)
- Modal dialog (desktop)
- Card list for scheduled messages
- Status badges with colors
- Countdown display
- Smooth animations

INTERACTIONS:
- Long press send button to schedule
- Tap scheduled message to edit
- Swipe to delete
- Pull-to-refresh scheduled list
- Tap "Send Now" → Confirm dialog

IMPLEMENTATION STEPS:
1. Add "Schedule" option to message send
2. Build DateTimePicker component
3. Build ScheduleMessageModal
4. Build ScheduledMessagesPanel
5. Build ScheduledMessageItem
6. Implement edit functionality
7. Implement delete functionality
8. Implement send now functionality
9. Add status tracking
10. Add notifications for sent/failed
11. Integrate with chat interface
12. Test all scenarios

TESTING CHECKLIST:
- [ ] Schedule message works
- [ ] Date/time picker works
- [ ] Can't schedule in past
- [ ] Scheduled message appears in list
- [ ] Edit scheduled message works
- [ ] Delete scheduled message works
- [ ] Send now works immediately
- [ ] Message sends at scheduled time
- [ ] Failed messages handled gracefully
- [ ] Status updates correctly
- [ ] Countdown display accurate
- [ ] Notifications work
- [ ] Mobile responsive
- [ ] Timezone handling correct

BEGIN IMPLEMENTATION.
```

---

## 🗑️ CODE CLEANUP STRATEGY

### ⚠️ IMPORTANT CLEANUP POLICY

**BEFORE REMOVING ANY CODE, FOLLOW THIS DECISION TREE:**

```
For any backend code without frontend implementation:

1. Does backend functionality work?
   ├─ NO  → Remove (broken code)
   └─ YES → Go to step 2

2. Does frontend exist for this feature?
   ├─ YES, fully implemented → Keep (feature is complete)
   ├─ YES, partial/broken → Fix frontend connection
   └─ NO → Go to step 3

3. Would adding frontend make the app BETTER?
   ├─ YES (valuable feature) → IMPLEMENT FRONTEND FIRST
   │   Example: Highlights, Scheduled Messages, Notifications
   │   Action: Use implementation prompts above
   │
   └─ NO (not valuable) → Go to step 4

4. Is this truly duplicate code?
   ├─ YES (identical functionality exists elsewhere) → Remove duplicate
   │   Example: 3 ways to send messages, keep best one
   │
   └─ NO (unique functionality) → Go to step 5

5. Is this over-engineering for our scale?
   ├─ YES (feature flags, complex AI, collaborative editing) → Remove
   │   Reason: Adds complexity without value at current scale
   │
   └─ NO (reasonable feature) → KEEP for future

RESULT:
✅ IMPLEMENT FRONTEND - Backend ready, feature valuable
✅ KEEP - Functional code, may need later
❌ REMOVE DUPLICATE - Redundant implementation exists
❌ REMOVE OVER-ENGINEERING - Too complex for current needs
❌ REMOVE BROKEN - Non-functional code
```

---

### CLEANUP PROMPT TEMPLATE

```
You are conducting code analysis for the Swaggo codebase.

⚠️ CRITICAL RULE: 
IF BACKEND WORKS AND FRONTEND WOULD BE VALUABLE:
→ DO NOT REMOVE! Instead, IMPLEMENT FRONTEND first.

ONLY REMOVE CODE IF:
1. It's a TRUE DUPLICATE (same feature, different implementation)
2. It's over-engineered for our scale (feature flags, complex AI)
3. It's broken/non-functional
4. No frontend exists AND feature is not valuable

ANALYSIS REQUIRED FOR EACH FILE:

FILENAME: [full path]

CURRENT PURPOSE:
- What does this code do?
- What feature does it support?
- Is the backend implementation functional?

USAGE ANALYSIS:
- Is it imported anywhere? (grep for imports)
- Is it called/used anywhere? (grep for function/class names)
- Does frontend use its API endpoints?
- Does frontend have queries/mutations for this?
- Are there any dependencies on it?

VALUE ASSESSMENT:
- Would implementing frontend make the app better?
- Is this a feature users expect? (e.g., Highlights, Notifications)
- Does Instagram/competitors have this feature?
- What's the effort to implement frontend? (days/weeks/months)

DUPLICATION CHECK:
- Is there another implementation of the same feature?
- Which implementation is better/more complete?
- Can we consolidate into one?

REMOVAL JUSTIFICATION (ONLY if actually removing):
- Why remove this code?
- What category: Duplicate? Over-engineered? Broken? Not valuable?
- What evidence shows it should be removed?

IMPACT ASSESSMENT:
- Will removing this break anything?
- Are there any tests that will fail?
- Does documentation reference this?
- Are there any environment variables tied to this?

DEPENDENCIES TO CHECK:
- package.json dependencies
- Import statements
- Route registrations
- Service registrations
- Database models/schemas
- Environment variables
- Configuration files

RECOMMENDATION:
- [ ] IMPLEMENT FRONTEND - Backend works, feature valuable (USE PROMPTS ABOVE)
- [ ] KEEP - Functional code, may need later
- [ ] REMOVE DUPLICATE - Keep better version
- [ ] REMOVE OVER-ENGINEERING - Too complex for scale
- [ ] REMOVE BROKEN - Non-functional code

ACTION PLAN:
1. [Step 1]
2. [Step 2]
3. [Step 3]

After providing this analysis, WAIT FOR MY APPROVAL before proceeding.
```

### SPECIFIC CLEANUP TASKS

#### Task 1: Remove Unused REST Routes (CONFIRMED FOR REMOVAL)

```
❌ CLEANUP TASK: Remove These Unused REST Routes

CONFIRMED FOR REMOVAL (DO NOT IMPLEMENT):
2. Website/Backend/Routes/api/v1/TranslationRoutes.js
3. Website/Backend/Routes/api/v1/SmartCategorizationRoutes.js
4. Website/Backend/Routes/api/v1/SentimentAnalysisRoutes.js
5. Website/Backend/Routes/api/v1/CollaborativeEditingRoutes.js

IMPLEMENTED IN PROMPTS ABOVE (DO NOT REMOVE):
1. Website/Backend/Routes/api/v1/FeatureFlagRoutes.js ✅ (See Section 5)
6. Website/Backend/Routes/api/v1/MessageTemplateRoutes.js ✅ (See Section 6)

For EACH file, analyze using this framework:

STEP 1: BACKEND STATUS
- Show me the file content
- Does the backend code work? (check for TODOs, incomplete implementations)
- Is it registered in main.js/index.js?

STEP 2: FRONTEND STATUS
- Does frontend make ANY calls to these endpoints?
- Are there frontend service files for this?
- Are there components that should use this?

STEP 3: VALUE ASSESSMENT
- Would implementing frontend make the app better?
- What's the implementation effort? (refer to analysis in UNUSED_ROUTES_DETAILED_ANALYSIS.md)
- Does Instagram/WhatsApp/competitors have this?

STEP 4: RECOMMENDATION

For each file, choose ONE:

A) ✅ IMPLEMENT FRONTEND FIRST
   - Backend works
   - Feature is valuable (Highlights, Scheduled Messages, etc.)
   - Reasonable implementation effort
   - Action: Use implementation prompts from sections 3-5 above
   - DO NOT REMOVE until we decide not to implement

B) ❌ REMOVE - Over-Engineering
   - Backend works BUT feature is over-engineered for our scale
   - Examples: Feature flags (need admin panel), Collaborative editing (6 months work)
   - Action: Safe to remove

C) ❌ REMOVE - Non-Functional
   - Backend has TODOs or placeholder code
   - AI services not integrated (Translation, Sentiment, Categorization)
   - Would need major work to make functional
   - Action: Remove broken code

D) ⚠️ KEEP FOR LATER
   - Backend works
   - Feature has some value
   - Not urgent to implement
   - Action: Keep but deprioritize

REMOVAL PLAN (ONLY for option B or C):
- Files to delete
- Import statements to remove
- Route registrations to remove
- Database models to remove
- Controllers/services to remove
- Tests to remove
- Documentation to update

REFER TO: See UNUSED_ROUTES_DETAILED_ANALYSIS.md for detailed analysis of each route.

WAIT FOR MY APPROVAL on recommendation for each file.
```

#### Task 2: Analyze GraphQL Resolvers (Implement Frontend OR Remove)

```
⚠️ CLEANUP TASK: Analyze GraphQL Resolvers - IMPLEMENT FRONTEND FIRST if valuable

ANALYZE THESE RESOLVER GROUPS:

GROUP 1: highlight.resolvers.js
- getUserHighlights
- getHighlightById
- createHighlightWithStories
- addStoryToHighlight
- removeStoryFromHighlight
- deleteHighlight
- updateHighlight

GROUP 2: scheduled-message.resolvers.js
- getScheduledMessagesByChat
- getScheduledMessage
- createScheduledMessage
- updateScheduledMessage
- deleteScheduledMessage
- sendScheduledMessageNow

GROUP 3: missing.resolvers.js (Post Stats & Discovery)
- getPostStats
- getTrendingPosts
- getPostsByHashtag
- searchPosts
- SharePost
- ReportPost

GROUP 4: missing.resolvers.js (Follow Requests)
- getFollowRequests
- getSentFollowRequests
- SendFollowRequest
- AcceptFollowRequest
- RejectFollowRequest
- CancelFollowRequest

For EACH RESOLVER GROUP, analyze:

STEP 1: BACKEND STATUS
- Show me the resolver code
- Is the implementation complete? (check for TODOs)
- Does it have proper error handling?

STEP 2: FRONTEND STATUS
- Does frontend have GraphQL query files for this? (check lib/graphql/)
- Are there components importing these queries?
- Search for: import { GET_HIGHLIGHTS } or similar

STEP 3: SCHEMA STATUS
- Check schema definitions
- Check TypeScript types
- Are there schema/type mismatches?

STEP 4: VALUE ASSESSMENT
- Is this feature in the implementation prompts above? (Sections 1-5)
- Would implementing frontend be valuable?
- What's the implementation effort?

STEP 5: RECOMMENDATION

For each resolver group, choose ONE:

A) ✅ IMPLEMENT FRONTEND FIRST
   - Backend resolvers work
   - Feature is valuable (see UNUSED_GRAPHQL_RESOLVERS_ANALYSIS.md)
   - Reasonable implementation effort (2-3 weeks)
   - Action: Use implementation prompts from sections 4-5 above
   - Examples: Highlights, Scheduled Messages
   - DO NOT REMOVE until we decide not to implement

B) ✅ KEEP - Already in Use
   - Frontend already uses these resolvers
   - Components exist and working
   - Examples: Follow Requests, Post Stats (ACTIVELY USED)
   - Action: No changes needed

C) ❌ REMOVE - Schema Mismatch
   - Frontend expects different schema than backend provides
   - Would need major refactoring to align
   - Not worth the effort
   - Action: Remove mismatched resolvers

D) ⚠️ KEEP FOR LATER
   - Backend works
   - Feature has some value
   - Not urgent to implement
   - Action: Keep but deprioritize

REMOVAL PLAN (ONLY for option C):
1. Resolver functions to remove
2. Schema type definitions to remove
3. TypeScript types to remove
4. Frontend query files to remove (if orphaned)
5. Related database queries to simplify
6. Related services that become unused

REFER TO: See UNUSED_GRAPHQL_RESOLVERS_ANALYSIS.md for:
- Full analysis of each resolver group
- Frontend/backend mismatch details
- Implementation effort estimates
- Value assessment

IMPORTANT FINDINGS from analysis:
- Follow Requests: ✅ KEEP (actively used)
- Post Stats: ✅ KEEP (actively used)
- Highlights: ⚠️ IMPLEMENT FRONTEND (backend ready, frontend queries exist, no UI)
- Scheduled Messages: ⚠️ IMPLEMENT FRONTEND (backend ready, frontend queries exist, no UI)

WAIT FOR MY DECISION on each resolver group.
```

#### Task 3: Consolidate TRUE Duplicate Code ONLY

```
⚠️ CLEANUP TASK: Consolidate ONLY True Duplicates - Same Feature, Different Implementation

DEFINITION OF TRUE DUPLICATE:
- SAME functionality
- DIFFERENT implementation
- NOT complementary (like REST for CRUD + Socket.IO for real-time)

EXAMPLES TO ANALYZE:

1. MESSAGING IMPLEMENTATIONS
   Current state: Messages can be sent via 3 methods:
   - REST: POST /api/v1/messages
   - Socket.IO: socket.emit('send_message')
   - GraphQL: mutation SendMessage

   Question: Are these TRUE duplicates or complementary?
   - Socket.IO: Real-time sending (instant)
   - GraphQL: Fetching message history (with pagination)
   - REST: Admin/bulk operations?

   Analysis needed:
   - Show each implementation
   - Show frontend usage of each
   - Determine if they serve different purposes

   If TRUE duplicates:
   - Keep best implementation
   - Migrate frontend from others
   - Remove redundant code

   If complementary:
   - Keep all
   - Document which to use when

2. PROFILE QUERY DUPLICATES
   Check for:
   - Multiple ways to fetch same profile data
   - Duplicate profile resolvers
   - Redundant REST + GraphQL for same data

3. AUTHENTICATION DUPLICATES
   Check for:
   - Multiple login endpoints
   - Duplicate token validation
   - Redundant session management

ANALYSIS PROCESS:

For each potential duplicate:

STEP 1: CONFIRM IT'S A TRUE DUPLICATE
- Show both implementations
- Do they do EXACTLY the same thing?
- Or do they serve different purposes?

STEP 2: USAGE ANALYSIS
- Which is used more in frontend?
- Which is more recent/better implemented?
- Which has better error handling?
- Which is more performant?

STEP 3: KEEP THE BEST ONE
- Choose implementation to keep based on:
  * Most used in frontend
  * Better implementation quality
  * Better fits our architecture
  * More maintainable

STEP 4: MIGRATION PLAN
- List frontend files using deprecated method
- Show code changes needed
- Provide migration guide

STEP 5: REMOVAL PLAN
- Backend files to remove
- Routes/resolvers to remove
- Tests to update
- Documentation to update

RECOMMENDATION FRAMEWORK:

For Messaging:
- KEEP: Socket.IO for sending (real-time)
- KEEP: GraphQL for fetching (pagination, filters)
- REMOVE: REST if truly redundant
  * Unless used for admin/bulk operations
  * Check usage first!

For Other Features:
- If GraphQL + REST exist for same data:
  * Prefer GraphQL (modern, flexible)
  * Keep REST only if:
    - Used by external integrations
    - Required for webhooks
    - Serves different use case

⚠️ IMPORTANT:
- Do NOT remove complementary implementations
- Do NOT remove if unsure
- Migrate frontend BEFORE removing backend
- Test thoroughly after migration

Show me:
1. Which implementations are TRUE duplicates?
2. Which to keep and why?
3. Frontend files needing migration
4. Migration code changes
5. Backend files to remove
6. Testing plan

WAIT FOR MY APPROVAL before any changes.
```

---

## 📋 IMPLEMENTATION CHECKLIST

Use this checklist to track progress:

### CRITICAL FEATURES (Week 1-2)
- [ ] Follow Request System
  - [ ] FollowRequestButton component
  - [ ] FollowRequestNotifications component
  - [ ] FollowRequestsManager page
  - [ ] Real-time updates via Socket.IO
  - [ ] Integration with ProfileHeader
  - [ ] Integration with NotificationCenter

- [ ] Notifications System
  - [ ] Enhanced NotificationBell with badge
  - [ ] NotificationCenter full page
  - [ ] NotificationItem component
  - [ ] Filter tabs
  - [ ] Real-time updates via Socket.IO
  - [ ] Mark as read functionality
  - [ ] Click navigation

### HIGH PRIORITY (Week 2-3)
- [ ] Trending & Hashtag Pages
  - [ ] Explore/Trending page
  - [ ] Hashtag detail pages
  - [ ] Clickable hashtags
  - [ ] Post analytics
  - [ ] Share functionality
  - [ ] Report functionality

- [ ] Story Highlights
  - [ ] HighlightsSection enhancement
  - [ ] HighlightViewer component
  - [ ] CreateHighlightModal
  - [ ] EditHighlightModal
  - [ ] Cover selection
  - [ ] Expired stories selector

### MEDIUM PRIORITY (Week 3-4)
- [ ] Scheduled Messages
  - [ ] Schedule message modal
  - [ ] Scheduled messages panel
  - [ ] Edit scheduled messages
  - [ ] Delete scheduled messages
  - [ ] Send now functionality
  - [ ] Failed message handling

### CODE CLEANUP (Week 3-4)
- [ ] Remove unused REST routes
  - [ ] FeatureFlagRoutes
  - [ ] TranslationRoutes
  - [ ] SmartCategorizationRoutes
  - [ ] SentimentAnalysisRoutes
  - [ ] CollaborativeEditingRoutes
  - [ ] MessageTemplateRoutes

- [ ] Remove unused GraphQL resolvers
  - [ ] Highlight resolvers (if not implementing)
  - [ ] Scheduled message resolvers (if not implementing)
  - [ ] Unused post/profile analytics

- [ ] Consolidate duplicate code
  - [ ] Messaging endpoints
  - [ ] Profile queries
  - [ ] Any other overlaps found

---

## 🎓 BEST PRACTICES REMINDER

When implementing, always:

1. **Follow Existing Patterns**
   - Use Apollo Client hooks (useQuery, useMutation)
   - Use Socket.IO from lib/socket.js
   - Use zustand for complex state
   - Use react-hot-toast for notifications

2. **Component Structure**
   - Small, focused components
   - Props for configuration
   - Hooks for logic
   - Separate business logic from UI

3. **Error Handling**
   - Try-catch for async operations
   - Error boundaries for components
   - User-friendly error messages
   - Fallback UI for failures

4. **Performance**
   - Lazy load components when possible
   - Optimize images
   - Debounce API calls
   - Virtual scrolling for long lists
   - Memoize expensive computations

5. **Accessibility**
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation
   - Focus management
   - Screen reader support

6. **Mobile First**
   - Start with mobile design
   - Add desktop enhancements
   - Touch-friendly targets
   - Responsive layouts
   - Test on actual devices

7. **Testing**
   - Test happy paths
   - Test error cases
   - Test edge cases
   - Test on multiple browsers
   - Test mobile and desktop

---

## 🚀 READY TO START?

To begin implementation:

1. Choose a feature from the priority list
2. Copy the specific feature prompt
3. Paste into your AI coding assistant
4. Review generated code
5. Test thoroughly
6. Move to next feature

For code cleanup:
1. Use cleanup prompts
2. AI will analyze and ask for approval
3. Review analysis carefully
4. Approve only after verification
5. Test after each removal

**Remember:** Quality over speed. Each feature should be production-ready before moving to the next.

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintainer:** Swaggo Development Team

---

## 📊 IMPLEMENTATION PROGRESS TRACKING

> **Note:** Detailed progress tracking is maintained in `IMPLEMENTATION_TODOS.md`

### Quick Status Overview

#### CRITICAL FEATURES (Week 1-2)
- [ ] 1️⃣ Follow Request System - ❌ Not Started
- [ ] 2️⃣ Notifications System - ❌ Not Started

#### HIGH PRIORITY (Week 2-3)
- [ ] 3️⃣ Trending & Hashtag Pages - ❌ Not Started
- [ ] 4️⃣ Story Highlights - ❌ Not Started

#### MEDIUM PRIORITY (Week 3-4)
- [ ] 5️⃣ Feature Flags System - ❌ Not Started
- [ ] 6️⃣ Message Templates - ❌ Not Started
- [ ] 7️⃣ Scheduled Messages - ❌ Not Started

#### CODE CLEANUP
- [ ] Remove Unused REST Routes - ❌ Not Started
- [ ] Analyze GraphQL Resolvers - ❌ Not Started
- [ ] Consolidate Duplicate Code - ❌ Not Started

### Overall Progress: 0% Complete (0/10 tasks)

**Last Session:** [Date] - Created TODO tracking system  
**Next Session Goal:** Begin Feature 1 - Follow Request System

---

## 📝 SESSION LOG

### Session 1 - January 2025
**Completed:**
- ✅ Created comprehensive TODO tracking system (IMPLEMENTATION_TODOS.md)
- ✅ Analyzed existing codebase structure
- ✅ Discovered 60-70% of backend work already complete!
- ✅ Created detailed status report (IMPLEMENTATION_STATUS_REPORT.md)
- ✅ Created quick start guide (START_HERE.md)
- ✅ Identified all features and cleanup tasks
- ✅ Set up progress tracking
- ✅ Revised timeline: 4-5 weeks (down from 6-8 weeks!)

**Key Findings:**
- 🎉 Most GraphQL queries already exist (90% complete)
- 🎉 Basic components already exist (40% complete)
- 🎉 Can complete 25-30% faster than estimated
- ⚠️ Need to enhance existing components, not create from scratch
- ⚠️ Need to add real-time Socket.IO integration
- ⚠️ Need to create zustand stores for state management

**Next Steps:**
1. Read IMPLEMENTATION_STATUS_REPORT.md for detailed analysis
2. Make critical decisions (Feature Flags: skip or implement?)
3. Begin Feature 1: Follow Request System (60% complete, 2-3 days)
4. Check existing components before creating new ones
5. Follow implementation prompts systematically

**Blockers:** None

**Decisions Made:**
- ✅ Feature Flags System: IMPLEMENT FULLY (100%)
- ✅ Implementation order: Feature Flags → Follow Requests → Notifications

---

### Session 2 - January 2025 (Week 1-2 Implementation)
**Completed:**
- ✅ **Feature Flags System** - 100% COMPLETE!
  - Created 11 new files
  - Full admin dashboard
  - All CRUD operations
  - Rollout percentage control
  - User whitelist management
  - FeatureFlagGuard HOC
  - useFeatureFlag hook
  - Time: ~2 hours

- ✅ **Follow Request System** - 100% COMPLETE!
  - Created 5 new files
  - Enhanced 2 existing files
  - Full requests manager
  - Accept/Reject/Cancel functionality
  - Real-time Socket.IO updates
  - Badge count
  - Time: ~1 hour

- ✅ **Notifications System** - 100% COMPLETE!
  - Created 4 new files
  - Enhanced 2 existing files
  - Full notification center
  - Infinite scroll pagination
  - Filter tabs
  - Real-time Socket.IO updates
  - 8+ notification types
  - Time: ~1.5 hours

**Total Progress:**
- Files Created: 20 new files
- Files Enhanced: 5 files
- Lines of Code: ~4,300+
- Time Taken: ~4.5 hours
- Status: ✅ ALL WEEK 1-2 FEATURES COMPLETE!

**Documentation Created:**
- FEATURE_FLAGS_COMPLETE.md
- FOLLOW_REQUESTS_COMPLETE.md
- NOTIFICATIONS_COMPLETE.md
- WEEK_1-2_COMPLETE.md

**Next Steps:**
1. ✅ Week 1-2 Features: COMPLETE
2. ⏭️ Week 2-3 Features: Ready to start
   - Trending & Hashtag Pages
   - Story Highlights

**Blockers:** None
