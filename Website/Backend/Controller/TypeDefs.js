import { gql } from "apollo-server";

const TypeDef=gql`


type Comments {
    commentid:String
    postid:String!
    profile:Profiles!
    userto:Profiles
    commenttoid:String
    comment:String!
}
type Likes {
    profile:Profiles!
    postid:String!
    comment: [Comments!]! 
}
type Posts {
    postid:String!
    profile:Profiles!
    postUrl:String!
    like:[Likes!]
    comments:[Comments!]
    title:String
    Description:String
    postType:String! # IMAGE or VIDEO
}
type Profiles {
    profileid:String!
    profilePic:String
    isPrivate:Boolean
    isVerified:Boolean
    username:String!
    name:String
    bio:String
    note:String
    followers:[Profiles!]
    following:[Profiles!]
    post:[Posts!]
    likedpost:[Posts!]
    savedpost:[Posts!]
    # tagpost:[Posts!]
}
type Query{
hello: String
    getUsers:[Profiles!]
    getUserbyUsername(username:String):Profiles

    # Feed Posts
    getPosts:[Posts!]
    getPostbyId(postid:String!):Posts
}
# type Result{
#     success:Boolean!
#     msg:String
# }

type Mutation {   
    
     # User Profiles
    CreateProfile(username:String!):Profiles
    DeleteProfile(id:String!):Profiles
    UpdateProfile(id:String!,New_username:String,profilesPic:String,name:String,bio:String,Note:String):Profiles
    #Posting Post and updating it
    CreatePost(profileid:String!,postUrl:String!,title:String,Description:String,postType:String!):Posts
    DeletePost(postid:String!):Posts
    UpdatePost(postid:String!,title:String,Description:String):Posts
    # Commenting on Post
    CreateComment(postid:String!,profileid:String!,usertoid:String,commenttoid:String,comment:String!):Comments
    DeleteComment(postid:String!,commentid:String!):Comments
    UpdateComment(postid:String!,commentid:String!,comment:String!):Comments
    # Liking Post
    ToggleLike(profileid:String!,postid:String!,commentid:String):Likes
    # Saving Post
    ToggleSavePost(profileid:String!,postid:String!):Posts
    # Following and UnFollowing User
    ToggleFollowUser(profileid:String!,followid:String!):Profiles   # profileid follow karegi followid ko
    # Tagging/Mentioning User in Post/Story
    Tag_and_MentionPost(profileid:String!,postid:String!,tag:[String]!):Profiles
}


`

export default TypeDef