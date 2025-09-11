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
    mediaUrl:String!
    mediaType:String!
    createdAt:String
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
}


`;

export default TypeDef
