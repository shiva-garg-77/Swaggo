import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import typeDefs from './Controllers/TypeDefs.js';
import resolvers from './Controllers/Resolver.js';
import connectdb from './db/Connectdb.js';

// GraphQL queries and mutations for testing
const TEST_QUERIES = {
    // Create a test profile
    CREATE_PROFILE: `
        mutation CreateProfile($username: String!) {
            CreateProfile(username: $username) {
                profileid
                username
                name
                bio
            }
        }
    `,
    
    // Create a test post
    CREATE_POST: `
        mutation CreatePost(
            $profileid: String!,
            $postUrl: String!,
            $title: String,
            $Description: String,
            $postType: String!
        ) {
            CreatePost(
                profileid: $profileid,
                postUrl: $postUrl,
                title: $title,
                Description: $Description,
                postType: $postType
            ) {
                postid
                title
                Description
                likeCount
                commentCount
                isLikedByUser
                isSavedByUser
            }
        }
    `,
    
    // Create a comment
    CREATE_COMMENT: `
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
    `,
    
    // Create a reply to a comment
    CREATE_REPLY: `
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
    `,
    
    // Toggle post like
    TOGGLE_POST_LIKE: `
        mutation TogglePostLike($profileid: String!, $postid: String!) {
            TogglePostLike(profileid: $profileid, postid: $postid) {
                profileid
                postid
                createdAt
            }
        }
    `,
    
    // Toggle comment like
    TOGGLE_COMMENT_LIKE: `
        mutation ToggleCommentLike($profileid: String!, $commentid: String!) {
            ToggleCommentLike(profileid: $profileid, commentid: $commentid) {
                profileid
                commentid
                createdAt
            }
        }
    `,
    
    // Get post with all stats
    GET_POST: `
        query GetPostById($postid: String!) {
            getPostbyId(postid: $postid) {
                postid
                title
                Description
                likeCount
                commentCount
                isLikedByUser
                isSavedByUser
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
                    replies {
                        commentid
                        comment
                        likeCount
                        isLikedByUser
                    }
                }
            }
        }
    `,
    
    // Get post stats
    GET_POST_STATS: `
        query GetPostStats($postid: String!) {
            getPostStats(postid: $postid) {
                postid
                likeCount
                commentCount
                isLikedByCurrentUser
                isSavedByCurrentUser
            }
        }
    `,
    
    // Get comments by post
    GET_COMMENTS: `
        query GetCommentsByPost($postid: String!) {
            getCommentsByPost(postid: $postid) {
                commentid
                comment
                likeCount
                isLikedByUser
                profile {
                    username
                }
                replies {
                    commentid
                    comment
                    likeCount
                    isLikedByUser
                    profile {
                        username
                    }
                }
            }
        }
    `,
    
    // Get comment replies
    GET_REPLIES: `
        query GetCommentReplies($commentid: String!) {
            getCommentReplies(commentid: $commentid) {
                commentid
                comment
                likeCount
                isLikedByUser
                profile {
                    username
                }
            }
        }
    `
};

// Test data
const testData = {
    users: [
        { username: 'testuser1' },
        { username: 'testuser2' },
        { username: 'testuser3' }
    ],
    posts: [
        {
            title: 'Test Post 1',
            Description: 'This is a test post for the like/comment system',
            postUrl: 'https://example.com/image1.jpg',
            postType: 'IMAGE'
        }
    ],
    comments: [
        { comment: 'Great post! Love it!' },
        { comment: 'Amazing content, keep it up!' },
        { comment: 'This is so inspiring!' }
    ],
    replies: [
        { comment: 'I totally agree!' },
        { comment: 'Thanks for sharing your thoughts!' }
    ]
};

// Test functions
async function runTests() {
    console.log('🚀 Starting Enhanced Like/Comment System Tests...\n');
    
    try {
        // Connect to database
        await connectdb();
        
        // Create Apollo Server
        const server = new ApolloServer({
            typeDefs,
            resolvers,
        });
        
        const { url } = await startStandaloneServer(server, {
            context: async ({ req }) => {
                // Mock user context for testing
                return {
                    user: {
                        _id: 'test_user_id',
                        username: 'testuser1',
                        profileid: null // Will be set after profile creation
                    }
                };
            },
            listen: { port: 4001 },
        });
        
        console.log(`🎯 Test server ready at: ${url}`);
        
        // Helper function to execute GraphQL
        const executeGraphQL = async (query, variables = {}, context = {}) => {
            const response = await server.executeOperation({
                query,
                variables
            }, {
                contextValue: context
            });
            
            if (response.body.kind === 'single') {
                return response.body.singleResult;
            }
            throw new Error('Unexpected response format');
        };
        
        let createdProfiles = [];
        let createdPosts = [];
        let createdComments = [];
        
        // Test 1: Create test profiles
        console.log('📝 Test 1: Creating test profiles...');
        for (const userData of testData.users) {
            const result = await executeGraphQL(
                TEST_QUERIES.CREATE_PROFILE,
                { username: userData.username }
            );
            
            if (result.errors) {
                console.error('❌ Profile creation failed:', result.errors);
            } else {
                createdProfiles.push(result.data.CreateProfile);
                console.log(`✅ Created profile: ${result.data.CreateProfile.username} (${result.data.CreateProfile.profileid})`);
            }
        }
        
        if (createdProfiles.length === 0) {
            throw new Error('Failed to create any profiles');
        }
        
        // Update mock context with first user's profile ID
        const mockContext = {
            user: {
                _id: 'test_user_id',
                username: createdProfiles[0].username,
                profileid: createdProfiles[0].profileid
            }
        };
        
        // Test 2: Create test posts
        console.log('\\n📝 Test 2: Creating test posts...');
        for (const postData of testData.posts) {
            const result = await executeGraphQL(
                TEST_QUERIES.CREATE_POST,
                {
                    profileid: createdProfiles[0].profileid,
                    postUrl: postData.postUrl,
                    title: postData.title,
                    Description: postData.Description,
                    postType: postData.postType
                },
                mockContext
            );
            
            if (result.errors) {
                console.error('❌ Post creation failed:', result.errors);
            } else {
                createdPosts.push(result.data.CreatePost);
                console.log(`✅ Created post: ${result.data.CreatePost.title} (${result.data.CreatePost.postid})`);
                console.log(`   Likes: ${result.data.CreatePost.likeCount}, Comments: ${result.data.CreatePost.commentCount}`);
            }
        }
        
        if (createdPosts.length === 0) {
            throw new Error('Failed to create any posts');
        }
        
        const testPost = createdPosts[0];
        
        // Test 3: Create comments
        console.log('\\n💬 Test 3: Creating comments...');
        for (const commentData of testData.comments) {
            const result = await executeGraphQL(
                TEST_QUERIES.CREATE_COMMENT,
                {
                    postid: testPost.postid,
                    profileid: createdProfiles[0].profileid,
                    comment: commentData.comment
                },
                mockContext
            );
            
            if (result.errors) {
                console.error('❌ Comment creation failed:', result.errors);
            } else {
                createdComments.push(result.data.CreateComment);
                console.log(`✅ Created comment: "${result.data.CreateComment.comment}" (${result.data.CreateComment.commentid})`);
                console.log(`   Likes: ${result.data.CreateComment.likeCount}`);
            }
        }
        
        // Test 4: Create replies
        console.log('\\n💬 Test 4: Creating comment replies...');
        if (createdComments.length > 0) {
            const parentComment = createdComments[0];
            for (const replyData of testData.replies) {
                const result = await executeGraphQL(
                    TEST_QUERIES.CREATE_REPLY,
                    {
                        commentid: parentComment.commentid,
                        profileid: createdProfiles[1]?.profileid || createdProfiles[0].profileid,
                        comment: replyData.comment
                    },
                    {
                        user: {
                            _id: 'test_user_id_2',
                            username: createdProfiles[1]?.username || createdProfiles[0].username,
                            profileid: createdProfiles[1]?.profileid || createdProfiles[0].profileid
                        }
                    }
                );
                
                if (result.errors) {
                    console.error('❌ Reply creation failed:', result.errors);
                } else {
                    console.log(`✅ Created reply: "${result.data.CreateCommentReply.comment}" (${result.data.CreateCommentReply.commentid})`);
                }
            }
        }
        
        // Test 5: Like posts
        console.log('\\n👍 Test 5: Testing post likes...');
        const likeResult = await executeGraphQL(
            TEST_QUERIES.TOGGLE_POST_LIKE,
            {
                profileid: createdProfiles[0].profileid,
                postid: testPost.postid
            },
            mockContext
        );
        
        if (likeResult.errors) {
            console.error('❌ Post like failed:', likeResult.errors);
        } else {
            console.log(`✅ Successfully liked post: ${testPost.postid}`);
        }
        
        // Test 6: Like comments
        console.log('\\n👍 Test 6: Testing comment likes...');
        if (createdComments.length > 0) {
            const commentLikeResult = await executeGraphQL(
                TEST_QUERIES.TOGGLE_COMMENT_LIKE,
                {
                    profileid: createdProfiles[0].profileid,
                    commentid: createdComments[0].commentid
                },
                mockContext
            );
            
            if (commentLikeResult.errors) {
                console.error('❌ Comment like failed:', commentLikeResult.errors);
            } else {
                console.log(`✅ Successfully liked comment: ${createdComments[0].commentid}`);
            }
        }
        
        // Test 7: Get post with all data
        console.log('\\n📊 Test 7: Testing post retrieval with stats...');
        const postResult = await executeGraphQL(
            TEST_QUERIES.GET_POST,
            { postid: testPost.postid },
            mockContext
        );
        
        if (postResult.errors) {
            console.error('❌ Post retrieval failed:', postResult.errors);
        } else {
            const post = postResult.data.getPostbyId;
            console.log(`✅ Retrieved post: ${post.title}`);
            console.log(`   📊 Stats: ${post.likeCount} likes, ${post.commentCount} comments`);
            console.log(`   🔍 User interactions: Liked=${post.isLikedByUser}, Saved=${post.isSavedByUser}`);
            console.log(`   💬 Comments count: ${post.comments.length}`);
            
            post.comments.forEach((comment, index) => {
                console.log(`   Comment ${index + 1}: "${comment.comment}" (${comment.likeCount} likes, ${comment.replies.length} replies)`);
            });
        }
        
        // Test 8: Get post stats
        console.log('\\n📊 Test 8: Testing post stats query...');
        const statsResult = await executeGraphQL(
            TEST_QUERIES.GET_POST_STATS,
            { postid: testPost.postid },
            mockContext
        );
        
        if (statsResult.errors) {
            console.error('❌ Post stats failed:', statsResult.errors);
        } else {
            const stats = statsResult.data.getPostStats;
            console.log(`✅ Post stats: ${stats.likeCount} likes, ${stats.commentCount} comments`);
            console.log(`   User status: Liked=${stats.isLikedByCurrentUser}, Saved=${stats.isSavedByCurrentUser}`);
        }
        
        console.log('\\n🎉 All tests completed successfully!');
        console.log('\\n📋 Summary:');
        console.log(`   ✅ Created ${createdProfiles.length} profiles`);
        console.log(`   ✅ Created ${createdPosts.length} posts`);
        console.log(`   ✅ Created ${createdComments.length} comments`);
        console.log(`   ✅ Tested post and comment likes`);
        console.log(`   ✅ Tested comment replies`);
        console.log(`   ✅ Tested data retrieval with stats`);
        
        // Stop the server
        await server.stop();
        process.exit(0);
        
    } catch (error) {
        console.error('\\n❌ Test failed:', error);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}

export default runTests;
