const TypeDef = `



type Comments {
    commentid:String
    postid:String!
    profile:Profiles!
    userto:Profiles
    commenttoid:String
    comment:String!
    mentions:[Mentions!]
    replies:[Comments!]
    likeCount:Int!
    isLikedByUser:Boolean!
    createdAt:String
    updatedAt:String
}
type Likes {
    profileid:String!
    profile:Profiles!
    postid:String!
    commentid:String
    createdAt:String
}
type Drafts {
    draftid:String!
    profileid:String!
    profile:Profiles!
    postUrl:String
    postType:String
    title:String
    caption:String
    location:String
    taggedPeople:[String!]
    tags:[String!]
    allowComments:Boolean
    hideLikeCount:Boolean
    autoPlay:Boolean
    createdAt:String
    updatedAt:String
}
type Posts {
    postid:String!
    profile:Profiles!
    postUrl:String!
    like:[Likes!]
    comments:[Comments!]
    mentions:[Mentions!]
    likeCount:Int!
    commentCount:Int!
    isLikedByUser:Boolean!
    isSavedByUser:Boolean!
    title:String
    Description:String
    postType:String! # IMAGE, VIDEO, or TEXT
    location:String
    taggedPeople:[String!]
    tags:[String!]
    allowComments:Boolean
    hideLikeCount:Boolean
    autoPlay:Boolean
    isCloseFriendOnly:Boolean
    createdAt:String
    updatedAt:String
}
type Story {
    storyid:String!
    profileid:String!
    profile:Profiles!
    mediaUrl:String!
    mediaType:String!
    caption:String
    viewers:[StoryViewer!]
    viewersCount:Int!
    isViewedByUser:Boolean!
    isActive:Boolean!
    savedToHighlights:Boolean!
    expiresAt:String
    createdAt:String
    updatedAt:String
}

type StoryViewer {
    profileid:String!
    profile:Profiles!
    viewedAt:String
}
type HighlightStory {
    storyid:String!
    mediaUrl:String!
    mediaType:String!
    caption:String
    originalStoryDate:String!
    addedToHighlightAt:String!
}
type Highlight {
    highlightid:String!
    profileid:String!
    profile:Profiles!
    title:String!
    coverImage:String
    stories:[HighlightStory!]!
    isActive:Boolean!
    viewCount:Int!
    category:String
    storyCount:Int!
    createdAt:String
    updatedAt:String
}
type Memory {
    memoryid:String!
    profileid:String!
    profile:Profiles!
    title:String!
    coverImage:String
    postUrl:String
    stories:[Story!]!
    createdAt:String
    updatedAt:String
}
type BlockedAccount {
    blockid:String!
    profileid:String!
    blockedprofileid:String!
    profile:Profiles!
    blockedProfile:Profiles!
    reason:String
    createdAt:String
    updatedAt:String
}
type RestrictedAccount {
    restrictid:String!
    profileid:String!
    restrictedprofileid:String!
    profile:Profiles!
    restrictedProfile:Profiles!
    createdAt:String
    updatedAt:String
}
type CloseFriends {
    closefriendid:String!
    profileid:String!
    closeFriend:Profiles!
    profile:Profiles!
    status:String!
    createdAt:String
    updatedAt:String
}
type Mentions {
    mentionid:String!
    mentionedprofileid:String!
    mentionerprofileid:String!
    mentionedProfile:Profiles!
    mentionerProfile:Profiles!
    contexttype:String!
    contextid:String!
    isnotified:Boolean!
    isread:Boolean!
    createdAt:String
    updatedAt:String
}

type MessageAttachment {
    type:String!
    url:String!
    filename:String
    size:Int
    mimetype:String
}

type MessageReaction {
    profileid:String!
    profile:Profiles!
    emoji:String!
    createdAt:String
}

type MessageReadStatus {
    profileid:String!
    profile:Profiles!
    readAt:String
}

type MessageEditHistory {
    content:String!
    editedAt:String
}

type Message {
    messageid:String!
    chatid:String!
    chat:Chat!
    senderid:String!
    sender:Profiles!
    messageType:String!
    content:String
    attachments:[MessageAttachment!]
    replyTo:Message
    mentions:[Profiles!]
    reactions:[MessageReaction!]
    readBy:[MessageReadStatus!]
    isEdited:Boolean
    editHistory:[MessageEditHistory!]
    isDeleted:Boolean
    deletedBy:Profiles
    deletedAt:String
    messageStatus:String
    createdAt:String
    updatedAt:String
    linkPreviews:[LinkPreview!]
}

type LinkPreview {
    url: String!
    title: String
    description: String
    image: String
    siteName: String
}

type PageInfo {
    hasNextPage:Boolean!
    hasPreviousPage:Boolean!
    startCursor:String
    endCursor:String
}

type MessageConnection {
    messages:[Message!]!
    pageInfo:PageInfo!
    totalCount:Int!
}

type Chat {
    chatid:String!
    participants:[Profiles!]!
    chatType:String!
    chatName:String
    chatAvatar:String
    lastMessage:Message
    lastMessageAt:String
    isActive:Boolean!
    mutedBy:[Profiles!]
    adminIds:[Profiles!]
    createdBy:Profiles!
    messages:[Message!]
    createdAt:String
    updatedAt:String
}

type CallLog {
    callId: String!
    chatid: String!
    callerId: String!
    caller: Profiles!
    receiverId: String
    receiver: Profiles
    participants: [Profiles!]!
    callType: String!
    status: String!
    duration: Int!
    startedAt: String
    answeredAt: String
    endedAt: String
    endedBy: String
    endReason: String
    quality: CallQuality
    techDetails: CallTechDetails
    isRecorded: Boolean!
    recordingUrl: String
    hadScreenShare: Boolean!
    notificationStatus: CallNotificationStatus
    createdAt: String
    updatedAt: String
}

type CallQuality {
    overall: String
    audio: String
    video: String
    connection: String
}

type CallTechDetails {
    iceConnectionState: String
    connectionState: String
    signalingState: String
    bandwidth: Bandwidth
    codec: Codec
    resolution: Resolution
    frameRate: Int
    jitter: Int
    packetLoss: Int
    latency: Int
}

type Bandwidth {
    upload: Int
    download: Int
}

type Codec {
    audio: String
    video: String
}

type Resolution {
    width: Int
    height: Int
}

type CallNotificationStatus {
    sent: Boolean!
    delivered: Boolean!
    read: Boolean!
    sentAt: String
    deliveredAt: String
    readAt: String
}

type UserSettings {
    profileid:String!
    allowMentions:Boolean!
    mentionNotifications:Boolean!
    tagNotifications:Boolean!
    showTaggedPosts:Boolean!
    isPrivate:Boolean!
    allowMessages:String!
    showActivity:Boolean!
    twoFactor:Boolean!
    notificationsEnabled:Boolean!
    darkMode:Boolean!
    createdAt:String
    updatedAt:String
}

type AuthPayload {
    token:String!
    user:Profiles!
}


type User {
    id:String!
    username:String!
    email:String!
    profilePicture:String
    profileid:String!
}
type Profiles {
    profileid:String!
    profilePic:String
    isPrivate:Boolean
    isVerified:Boolean
    username:String!
    name:String
    bio:String
    followers:[Profiles!]
    following:[Profiles!]
    followersCount:Int
    followingCount:Int
    postsCount:Int
    closeFriends:[CloseFriends!]
    closeFriendsOf:[CloseFriends!]
    post:[Posts!]
    drafts:[Drafts!]
    likedpost:[Posts!]
    savedpost:[Posts!]
    memories:[Memory!]
    blockedAccounts:[BlockedAccount!]
    restrictedAccounts:[RestrictedAccount!]
    mentions:[Mentions!]
    settings:UserSettings
    stories:[Story!]
    # tagpost:[Posts!]
}
type Query{
  hello: String
      getUsers:[Profiles!]
      getUserbyUsername(username:String):Profiles

    # Feed Posts
    getPosts:[Posts!]
    getPostbyId(postid:String!):Posts
    
    # Drafts
    getDrafts(profileid:String!):[Drafts!]
    getDraftById(draftid:String!):Drafts
    
    # Memories
    getMemories(profileid:String!):[Memory!]
    getMemoryById(memoryid:String!):Memory
    
    # Comments and Likes
    getCommentsByPost(postid:String!):[Comments!]
    getCommentReplies(commentid:String!):[Comments!]
    getLikesByPost(postid:String!):[Likes!]
    getLikesByComment(commentid:String!):[Likes!]
    getPostStats(postid:String!):PostStats
    
    # Block and Restrict Queries
    getBlockedAccounts(profileid:String!):[BlockedAccount!]
    getRestrictedAccounts(profileid:String!):[RestrictedAccount!]
    isUserBlocked(profileid:String!,targetprofileid:String!):Boolean!
    isUserRestricted(profileid:String!,targetprofileid:String!):Boolean!
    
    # Close Friends Queries
    getCloseFriends(profileid:String!):[CloseFriends!]
    isCloseFriend(profileid:String!,targetprofileid:String!):Boolean!
    
    # Mentions Queries
    getMentions(profileid:String!):[Mentions!]
    getMentionsByContext(contexttype:String!,contextid:String!):[Mentions!]
    
    # Search Users for mentions/tagging
    searchUsers(query:String!,limit:Int):[Profiles!]
    
    # User Settings Queries
    getUserSettings(profileid:String!):UserSettings
    
    # Stories Queries
    getStories(profileid:String):[Story!]
    getActiveStories:[Story!]
    getStoryById(storyid:String!):Story
    getStoryViewers(storyid:String!):[StoryViewer!]
    
    # Highlights Queries
    getHighlights(profileid:String!):[Highlight!]
    getHighlightById(highlightid:String!):Highlight
    
    # Chat Queries
    getChats(profileid:String!):[Chat!]
    getChatById(chatid:String!):Chat
    getChatByParticipants(participants:[String!]!):Chat
    
    # Message Queries
    getMessagesByChat(chatid:String!,limit:Int,cursor:String):MessageConnection
    getMessageById(messageid:String!):Message
    searchMessages(chatid:String!,query:String!):[Message!]
    
    # Chat Statistics
    getUnreadMessageCount(profileid:String!):Int
    getChatUnreadCount(chatid:String!,profileid:String!):Int
    
    # Call History Queries
    getCallHistory(profileid:String!):[CallLog!]
    getCallHistoryByChat(chatid:String!):[CallLog!]

    getScheduledMessages(chatId: String): [ScheduledMessage!]
    getScheduledMessage(scheduledMessageId: String!): ScheduledMessage
}

type PostStats {
    postid:String!
    likeCount:Int!
    commentCount:Int!
    isLikedByCurrentUser:Boolean!
    isSavedByCurrentUser:Boolean!
}
# type Result{
#     success:Boolean!
#     msg:String
# }

type Mutation {   
    
    # Authentication
    login(email:String!,password:String!):AuthPayload
    signup(username:String!,email:String!,password:String!):AuthPayload
    
     # User Profiles
    CreateProfile(username:String!):Profiles
    DeleteProfile(profileid:String!):Profiles
    UpdateProfile(profileid:String!,New_username:String,profilesPic:String,name:String,bio:String,isPrivate:Boolean,isVerified:Boolean):Profiles
    #Posting Post and updating it
    CreatePost(
        profileid:String!,
        postUrl:String!,
        title:String,
        Description:String,
        postType:String!,
        location:String,
        taggedPeople:[String!],
        tags:[String!],
        allowComments:Boolean,
        hideLikeCount:Boolean,
        autoPlay:Boolean,
        isCloseFriendOnly:Boolean
    ):Posts
    DeletePost(postid:String!):Posts
    UpdatePost(postid:String!,title:String,Description:String):Posts
    # Commenting on Post
    CreateComment(postid:String!,profileid:String!,usertoid:String,commenttoid:String,comment:String!):Comments
    CreateCommentReply(commentid:String!,profileid:String!,usertoid:String,comment:String!):Comments
    DeleteComment(postid:String!,commentid:String!):Comments
    UpdateComment(postid:String!,commentid:String!,comment:String!):Comments
    # Liking Post and Comments
    TogglePostLike(profileid:String!,postid:String!):Likes
    ToggleCommentLike(profileid:String!,commentid:String!):Likes
    # Saving Post
    ToggleSavePost(profileid:String!,postid:String!):Posts
    # Following and UnFollowing User
    ToggleFollowUser(profileid:String!,followid:String!):Profiles   # profileid follow karegi followid ko
    # Tagging/Mentioning User in Post/Story
    Tag_and_MentionPost(profileid:String!,postid:String!,tag:[String]!):Profiles
    
    # Draft Management
    CreateDraft(
        profileid:String!,
        postUrl:String,
        postType:String,
        title:String,
        caption:String,
        location:String,
        tags:[String!],
        taggedPeople:[String!],
        allowComments:Boolean,
        hideLikeCount:Boolean,
        autoPlay:Boolean
    ):Drafts
    UpdateDraft(
        draftid:String!,
        postUrl:String,
        postType:String,
        title:String,
        caption:String,
        location:String,
        tags:[String!],
        taggedPeople:[String!],
        allowComments:Boolean,
        hideLikeCount:Boolean,
        autoPlay:Boolean
    ):Drafts
    DeleteDraft(draftid:String!):Drafts
    PublishDraft(
        draftid:String!
    ):Posts

    # Memory Management
    CreateMemory(profileid:String!,title:String!,coverImage:String,postUrl:String):Memory
    UpdateMemory(memoryid:String!,title:String,coverImage:String,postUrl:String):Memory
    DeleteMemory(memoryid:String!):Memory
    AddStoryToMemory(memoryid:String!,mediaUrl:String!,mediaType:String!):Memory
    RemoveStoryFromMemory(memoryid:String!,storyid:String!):Memory
    
    # Block and Restrict Mutations
    BlockUser(profileid:String!,targetprofileid:String!,reason:String):BlockedAccount
    UnblockUser(profileid:String!,targetprofileid:String!):BlockedAccount
    RestrictUser(profileid:String!,targetprofileid:String!):RestrictedAccount
    UnrestrictUser(profileid:String!,targetprofileid:String!):RestrictedAccount
    
    # Close Friends Mutations
    AddCloseFriend(profileid:String!,targetprofileid:String!):CloseFriends
    RemoveCloseFriend(profileid:String!,targetprofileid:String!):CloseFriends
    
    # Mentions Mutations
    CreateMention(mentionedprofileid:String!,mentionerprofileid:String!,contexttype:String!,contextid:String!):Mentions
    MarkMentionAsRead(mentionid:String!):Mentions
    
    # User Settings Mutations
    UpdateUserSettings(
        profileid:String!,
        allowMentions:Boolean,
        mentionNotifications:Boolean,
        tagNotifications:Boolean,
        showTaggedPosts:Boolean,
        isPrivate:Boolean,
        allowMessages:String,
        showActivity:Boolean,
        twoFactor:Boolean,
        notificationsEnabled:Boolean,
        darkMode:Boolean
    ):UserSettings
    
    # Chat Mutations
    CreateChat(
        participants:[String!]!,
        chatType:String!,
        chatName:String,
        chatAvatar:String
    ):Chat
    UpdateChat(
        chatid:String!,
        chatName:String,
        chatAvatar:String
    ):Chat
    DeleteChat(chatid:String!):Chat
    AddParticipantToChat(chatid:String!,profileid:String!):Chat
    RemoveParticipantFromChat(chatid:String!,profileid:String!):Chat
    MuteChat(chatid:String!,profileid:String!):Chat
    UnmuteChat(chatid:String!,profileid:String!):Chat
    
    # Message Mutations
    SendMessage(
        chatid:String!,
        messageType:String!,
        content:String,
        attachments:[MessageAttachmentInput!],
        replyTo:String,
        mentions:[String!]
    ):Message
    EditMessage(
        messageid:String!,
        content:String!
    ):Message
    DeleteMessage(messageid:String!):Message
    ReactToMessage(
        messageid:String!,
        emoji:String!
    ):Message
    RemoveReaction(
        messageid:String!,
        emoji:String!
    ):Message
    MarkMessageAsRead(
        messageid:String!
    ):Message
    MarkChatAsRead(
        chatid:String!
    ):[Message!]
    
    # Story Mutations
    CreateStory(
        profileid:String!,
        mediaUrl:String!,
        mediaType:String!,
        caption:String
    ):Story
    DeleteStory(storyid:String!):Story
    ViewStory(storyid:String!):Story
    
    # Highlight Mutations
    CreateHighlight(
        profileid:String!,
        title:String!,
        coverImage:String,
        category:String
    ):Highlight
    UpdateHighlight(
        highlightid:String!,
        title:String,
        coverImage:String,
        category:String
    ):Highlight
    DeleteHighlight(highlightid:String!):Highlight
    AddStoryToHighlight(
        highlightid:String!,
        storyid:String!
    ):Highlight
    RemoveStoryFromHighlight(
        highlightid:String!,
        storyid:String!
    ):Highlight
    
    createScheduledMessage(input: ScheduledMessageInput!): ScheduledMessage
    cancelScheduledMessage(scheduledMessageId: String!): ScheduledMessage

}

type ScheduledMessage {
    scheduledMessageId: String!
    chatid: String!
    chat: Chat!
    senderid: String!
    sender: Profiles!
    messageType: String!
    content: String
    attachments: [MessageAttachment!]
    scheduledFor: String!
    status: String!
    retryCount: Int!
    maxRetries: Int!
    failureReason: String
    stickerData: StickerData
    gifData: GifData
    voiceData: VoiceData
    fileData: FileData
    linkPreviews: [LinkPreview!]
    createdAt: String
    updatedAt: String
}

type StickerData {
    id: String
    name: String
    preview: String
    url: String
    category: String
}

type GifData {
    id: String
    title: String
    url: String
    thumbnail: String
    category: String
    dimensions: GifDimensions
}

type GifDimensions {
    width: Int
    height: Int
}

type VoiceData {
    duration: Int
    size: Int
    mimeType: String
    fileId: String
    url: String
}

type FileData {
    fileId: String
    name: String
    size: Int
    mimeType: String
    url: String
}

input MessageAttachmentInput {
    type:String!
    url:String!
    filename:String
    size:Int
    mimetype:String
}

input ScheduledMessageInput {
    chatid: String!
    messageType: String
    content: String
    attachments: [MessageAttachmentInput!]
    scheduledFor: String!
    stickerData: StickerDataInput
    gifData: GifDataInput
    voiceData: VoiceDataInput
    fileData: FileDataInput
    linkPreviews: [LinkPreviewInput!]
}

input StickerDataInput {
    id: String
    name: String
    preview: String
    url: String
    category: String
}

input GifDataInput {
    id: String
    title: String
    url: String
    thumbnail: String
    category: String
    dimensions: GifDimensionsInput
}

input GifDimensionsInput {
    width: Int
    height: Int
}

input VoiceDataInput {
    duration: Int
    size: Int
    mimeType: String
    fileId: String
    url: String
}

input FileDataInput {
    fileId: String
    name: String
    size: Int
    mimeType: String
    url: String
}

input LinkPreviewInput {
    url: String!
    title: String
    description: String
    image: String
    siteName: String
}

`;

export default TypeDef














