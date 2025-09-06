import Profile from '../Model/FeedModels/Profile.js'
import Comment from '../Model/FeedModels/Comments.js'
import Post from '../Model/FeedModels/Post.js';
import Followers from '../Model/FeedModels/Followers.js';
import Following from '../Model/FeedModels/Following.js';
import Likes from '../Model/FeedModels/Likes.js';
import TagPost from '../Model/FeedModels/Tagpost.js';
import LikedPost from '../Model/FeedModels/LikedPost.js';
import SavedPost from '../Model/FeedModels/SavedPost.js';
import { v4 as uuidv4 } from 'uuid';


const Resolvers = {

    Profiles: {
        // parent = profile
        post: async (Parent) => {
            try {
                const post = await Post.find({ profileid: Parent.profileid });
                return post || [];
            } catch (err) {
                throw new Error(`Error fetching post for user ${Parent.username}: ${err.message}`);
            }
        },
        followers: async (Parent) => {
            try {
                const followers = await Followers.find({ profileid: Parent.profileid });
                return followers || [];
            } catch (err) {
                throw new Error(`Error fetching followers for user ${Parent.username}: ${err.message}`);
            }
        },
        following: async (Parent) => {
            try {
                const following = await Following.find({ profileid: Parent.profileid });
                return following || [];
            } catch (err) {
                throw new Error(`Error fetching following for user ${Parent.username}: ${err.message}`);
            }
        },
        likedpost: async (Parent) => {
            try {
                const likedPost = await LikedPost.find({ profileid: Parent.profileid });
                return likedPost || [];
            } catch (err) {
                throw new Error(`Error fetching liked post for user ${Parent.username}: ${err.message}`);
            }
        },
        savedpost: async (Parent) => {
            try {
                const savedPost = await SavedPost.find({ profileid: Parent.profileid });
                return savedPost || [];
            } catch (err) {
                throw new Error(`Error fetching saved post for user ${Parent.username}: ${err.message}`);
            }
        },

    },


    Posts: {
        profile: async (Parent) => {
            try {
                const post = await Post.findOne({ postid: Parent.postid });
                if (!post) {
                    throw new Error(`Post not found for id ${Parent.postid}`);
                }
                const profile = await Profile.findOne({ profileid: post.profileid });
                if (!profile) {
                    throw new Error(`Profile not found for post with id ${Parent.postid}`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching profile for post: ${err.message}`);
            }
        },
        like: async (Parent) => {


            try {
                const likes = await Likes.find({ postid: Parent.postid });
                return likes || [];
            } catch (err) {
                throw new Error(`Error fetching likes for post with id ${Parent.postid}: ${err.message}`);
            }
        },
        comments: async (Parent) => {
            try {
                const comments = await Comment.find({ postid: Parent.postid });
                return comments || [];
            } catch (err) {
                throw new Error(`Error fetching comments for post with id ${Parent.postid}: ${err.message}`);
            }
        }

    },

    Likes: {
        profile: async (Parent) => {
            try {
                const profile = await Profile.findOne({ profileid: Parent.profileid });
                if (!profile) {
                    throw new Error(`Profile with id ${Parent.profileid} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching profile for like: ${err.message}`);
            }
        },
        comment: async (Parent) => {
            try {
                if (!Parent.commentid) return [];

                const comment = await Comment.findOne({ commentid: Parent.commentid });
                return comment ? [comment] : [];
            } catch (err) {
                throw new Error(`Error fetching comment: ${err.message}`);
            }
        }

    },
    Comments: {
        profile: async (Parent) => {
            try {
                const profile = await Profile.findOne({ profileid: Parent.profileid });
                if (!profile) {
                    throw new Error(`Profile with id ${Parent.profileid} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching comments for post with id ${Parent.postid}: ${err.message}`);
            }
        },
        userto: async (Parent) => {
            try {
                const user = await Profile.findOne({ profileid: Parent.usertoid });
                if (!user) {
                    return null
                }
                return user;
            } catch (err) {
                throw new Error(`Error fetching user for id ${Parent.usertoid}: ${err.message}`);
            }
        }

    },

    Query: {
         hello: () => "Hello from Apollo!",
        getUsers: async () => {
            try {
                const profiles = await Profile.find()
                return profiles
            } catch (err) {
                throw new Error(`Error fetching users: ${err.message}`);
            }
        },

        // make it like this async (_,args,{user})
        getUserbyUsername: async (_, args, { user }) => {
            try {
                const username = args.username || user?.username;
                if (!username) {
                    throw new Error("Username is required");
                }
                const profile = await Profile.findOne({ username });
                if (!profile) {
                    throw new Error(`User with username ${username} not found`);
                }
                return profile;
            } catch (err) {
                throw new Error(`Error fetching user: ${err.message}`);
            }
        },
        getPosts: async () => {
            try {
                const posts = await Post.find();
                return posts;
            } catch (err) {
                throw new Error(`Error fetching posts: ${err.message}`);
            }
        },
        getPostbyId: async (_, { postid }) => {
            try {
                const post = await Post.findOne({ postid });
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`);
                }
                return post;
            } catch (err) {
                throw new Error(`Error fetching post: ${err.message}`);
            }
        },
    },




    Mutation: {
        CreateProfile: async (_, { username }) => {
            try {
                // Check if the user already exists
                const existingUser = await Profile.findOne({ username });
                if (existingUser) {
                    throw new Error(`User with username ${username} already exists`);
                }
                const Parent = new Profile({
                    profileid: uuidv4(),
                    username
                })
                await Parent.save()
                return Parent
            } catch (err) {
                throw new Error(`Error creating Parent: ${err.message}`);
            }
        },
        DeleteProfile: async (_, { profileid }) => {
            try {
                const Parent = await Profile.findOneAndDelete({ profileid })
                if (!Parent) {
                    throw new Error(`Profile with id ${profileid} not found`)
                }
                return Parent
            } catch (err) {
                throw new Error(`Error deleting Parent: ${err.message}`);
            }
        },
        UpdateProfile: async (_, { profileid, New_username, profilesPic, name, bio, Note, isPrivate, isVerified }) => {
            try {
                // Check if the new username exists
                const existingProfile = await Profile.findOne({ username: New_username });
                if (existingProfile) {
                    throw new Error(`Profile with username ${New_username} already exists`);
                }
                const Parent = await Profile.findOne({ profileid });
                if (!Parent) {
                    throw new Error(`Profile not found for id ${profileid}`);
                }
                Parent.updateOne({ profileid }, {
                    isPrivate: isPrivate || Parent.isPrivate,
                    isVerified: isVerified || Parent.isVerified,
                    username: New_username || Parent.username,
                    //  if  username is not provided, keep the old one
                    profilePic: profilesPic || Parent.profilePic,
                    name: name || Parent.name,
                    bio: bio || Parent.bio,
                    note: Note || Parent.note
                },
                    { new: true }
                );

                await Parent.save();
                return Parent;
            } catch (err) {
                throw new Error(`Error updating Parent: ${err.message}`);
            }
        },
        CreatePost: async (_, { profileid, postUrl, title, Description, postType }) => {
            try {
                const user = await Profile.findOne({ profileid });
                if (!user) {
                    throw new Error(`User with id ${profileid} does not exist`);
                }
                // Validate postUrl
                if (!postUrl || postUrl.replace(/\s+/g, '') === "") {
                    throw new Error("Post URL cannot be empty");
                }

                const newPost = new Post({
                    postid: uuidv4(),
                    profileid,
                    postUrl, // Use the uploaded file path or the provided URL
                    postType,
                    title,
                    Description
                })
                await newPost.save()
                return newPost;
            } catch (err) {
                throw new Error(`Error creating post: ${err.message}`);
            }
        },
        DeletePost: async (_, { postid }) => {
            try {
                const post = await Post.findOneAndDelete({ postid })
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`)
                }
                // Also delete associated cprofiles
                await Cprofile.deleteMany({ postid: post.postid });
                return post
            } catch (err) {
                throw new Error(`Error deleting post: ${err.message}`);
            }
        },
        UpdatePost: async (_, { postid, title, Description }) => {
            try {
                const post = await Post.findOne({ postid })
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`)
                }
                if (!title || title.replace(/\s+/g, '') == "") {
                    title = post.title
                }
                if (!Description || Description.replace(/\s+/g, '') == "") {
                    Description = post.Description
                }
                const updatedPost = await post.updateOne({
                    title, Description
                }, { new: true })
                return updatedPost
            } catch (err) {
                throw new Error(`Error updating post: ${err.message}`);
            }
        },
        CreateComment: async (_, { postid, profileid, usertoid,commenttoid, comment }) => {
            try {
                // Check if the user exists
                const userProfile = await Profile.findOne({ profileid });
                if (!userProfile) {
                    throw new Error(`User with id ${profileid} does not exist`);
                }
                if (usertoid) {
                    const userToProfile = await Profile.findOne({ profileid: usertoid });
                    if (!userToProfile) {
                        throw new Error(`User with id ${usertoid} does not exist`);
                    }
                }
                if(commenttoid){
                    const comment= await Comment.findOne({commentid:commenttoid})
                    if(!comment){
                        throw new Error(`comment with id ${commenttoid} does not exist`)
                    }
                }
                const post = await Post.findOne({ postid });
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`)
                }
                if (comment.replace(/\s+/g, '') === "") {
                    throw new Error("Comment cannot be empty");
                }
                const newComment = new Comment({
                    commentid: uuidv4(),
                    postid,
                    profileid,
                    usertoid,
                    commenttoid,
                    comment
                })
                await newComment.save()
                return newComment
            } catch (err) {
                throw new Error(`Error creating comment: ${err.message}`);
            }
        },
        DeleteComment: async (_, { postid, commentid }) => {
            // Check if the post exists
            const post = await Post.findOne({ postid });
            if (!post) {
                throw new Error(`Post with id ${postid} not found`);
            }
            // Check if the comment exists
            const comment = await Comment.findOne({ postid, commentid });
            if (!comment) {
                throw new Error(`Comment with id ${commentid} not found for post ${postid}`);
            }
            try {
                const deletedComment = await Comment.findOneAndDelete({ postid, commentid });
                if (!deletedComment) {
                    throw new Error(`Comment not found for post ${postid}`);
                }
                return deletedComment;
            } catch (err) {
                throw new Error(`Error deleting comment: ${err.message}`);
            }

        },
        UpdateComment: async (_, { postid, commentid, comment }) => {
            try {
                // Check if the post exists
                const post = await Post.findOne({ postid });
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`);
                }
                // Check if the comment exists
                const existingComment = await Comment.findOne({ postid, commentid });
                if (!existingComment) {
                    throw new Error(`Comment with id ${commentid} not found for post ${postid}`);
                }
                if (comment.replace(/\s+/g, '') === "") {
                    throw new Error("Comment cannot be empty");
                }
                existingComment.comment = comment;
                await existingComment.save();
                return existingComment;
            } catch (err) {
                throw new Error(`Error updating comment: ${err.message}`);
            }
        },
        ToggleLike: async (_, { postid, profileid, commentid }) => {
            try {
                // Check if the user exists
                const userProfile = await Profile.findOne({ profileid });
                if (!userProfile) {
                    throw new Error(`User with id ${profileid} does not exist`);
                }
                const post = await Post.findOne({ postid });
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`)
                }
                // If cprofileid is provided, check if the cprofile exists
                if (commentid) {
                    const comment = await Comment.findOne({ postid, commentid });
                    if (!comment) {
                        throw new Error(`Comment with id ${commentid} not found for post ${postid}`);
                    }
                    // If commentid is provided, we can assume the like is for the comment
                    const existingLike = await Likes.findOne({ postid, commentid, profileid });
                    let newLike
                    if (existingLike) {
                        // Unlike the comment
                        await Likes.deleteOne({ postid, commentid, profileid });
                    } else {
                        // Like the comment
                        newLike = new Likes({ postid, commentid, profileid });
                        await newLike.save();
                    }
                    return existingLike || newLike;
                }
                // If no commentid is provided, we assume the like is for the post
                const existingPostLike = await Likes.findOne({ postid, profileid });
                let newPostLike;
                if (existingPostLike) {
                    // Unlike the post
                    await Likes.deleteOne({ postid, profileid });
                    await LikedPost.deleteOne({ postid, profileid });
                } else {
                    // Like the post
                    newPostLike = new Likes({ postid, profileid });
                    const newLikedPost = new LikedPost({ postid, profileid });
                    await newLikedPost.save();
                    await newPostLike.save();
                }

                return existingPostLike || newPostLike;
            } catch (err) {
                throw new Error(`Error creating like: ${err.message}`);
            }
        },
        ToggleSavePost: async (_, { postid, profileid }) => {
            try {
                // Check if the user exists
                const userProfile = await Profile.findOne({ profileid });
                if (!userProfile) {
                    throw new Error(`User with id ${profileid} does not exist`);
                }
                const post = await Post.findOne({ postid });
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`);
                }
                // Check if the post is already saved
                const existingSavedPost = await SavedPost.findOne({ postid, profileid });
                if (existingSavedPost) {
                    // Unsaved the post
                    await SavedPost.deleteOne({ postid, profileid });
                } else {
                    // Saved the post
                    const newSavedPost = new SavedPost({ postid, profileid });
                    await newSavedPost.save();
                }
            } catch (err) {
                throw new Error(`Error toggling save post: ${err.message}`);
            }
        },
        ToggleFollowUser: async (_, { profileid, followid }) => {
            try {
                // Check if the user exists
                const userProfile = await Profile.findOne({ profileid });
                if (!userProfile) {
                    throw new Error(`User with id ${profileid} does not exist`);
                }
                const followUser = await Profile.findOne({ profileid: followid });
                if (!followUser) {
                    throw new Error(`User with id ${followid} does not exist`);
                }
                // Check if the users are already a follower 
                // follow id -> the user to be followed
                // profileid -> the user who is following
                const existingFollow = await Following.findOne({ profileid: profileid, followingid: followid });
                if (existingFollow) {
                    // Unfollow the user
                    await Following.deleteOne({ profileid: profileid, followingid: followid });
                    // Also remove the follower relationship
                    await Followers.deleteOne({ profileid: followid, followerid: profileid });
                } else {
                    // Follow the user
                    const newFollow = new Following({ profileid: profileid, followingid: followid });
                    const newFollower = new Followers({ profileid: followid, followerid: profileid });
                    await newFollower.save();
                    await newFollow.save();
                }
                return existingFollow || newFollow;
            } catch (err) {
                throw new Error(`Error toggling follow user: ${err.message}`);
            }
        },


        // check it not sure right or not
        Tag_and_MentionPost: async (_, { profileid, postid, tag }) => {
            try {
                // Check if the user exists
                const userProfile = await Profile.findOne({ profileid });
                if (!userProfile) {
                    throw new Error(`User with id ${profileid} does not exist`);
                }
                const post = await Post.findOne({ postid });
                if (!post) {
                    throw new Error(`Post with id ${postid} not found`);
                }
                // Check if the post is already tagged
                if (!Array.isArray(tag) || taprofileth === 0) {
                    throw new Error("Tag must be a non-empty array");
                }
                if (taprofileth > 20) {
                    throw new Error("Tag array must not exceed 20 users");
                }
                // Validate each tag profile ID
                for (const tagProfileId of tag) {
                    const taggedProfile = await Profile.findOne({ profileid: tagProfileId });
                    if (!taggedProfile) {
                        throw new Error(`Profile with id ${tagProfileId} does not exist`);
                    }
                }


                const existingTagPost = await TagPost.findOne({ postid, profileid });
                if (existingTagPost) {
                    // Untag the post
                    await TagPost.deleteOne({ postid, profileid });
                } else {
                    // Tag the post
                    const newTagPost = new TagPost({ postid, profileid, tag });
                    await newTagPost.save();
                }
            } catch (err) {
                throw new Error(`Error toggling tag post: ${err.message}`);
            }
        },
    }


}


export default Resolvers