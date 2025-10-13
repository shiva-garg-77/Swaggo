import Story from '../Models/FeedModels/Story.js';
import Profile from '../Models/FeedModels/Profile.js';
import { v4 as uuidv4 } from 'uuid';

const StoryResolvers = {
    // Story field resolvers
    Story: {
        profile: async (parent, args, context) => {
            try {
                // 🚀 PERFORMANCE FIX: Use DataLoader to prevent N+1 queries
                if (context.dataloaders && parent.profileid) {
                    // Use DataLoader for batch loading to prevent N+1 query problem
                    return await context.dataloaders.profileById.load(parent.profileid);
                } else {
                    // Fallback to direct database query if DataLoader not available
                    const profile = await Profile.findOne({ profileid: parent.profileid });
                    return profile;
                }
            } catch (error) {
                console.error('Error fetching story profile:', error);
                return null;
            }
        },
        viewers: async (parent, args, context) => {
            try {
                const profileIds = parent.viewers.map(viewer => viewer.profileid);
                
                // 🚀 PERFORMANCE FIX: Use DataLoader to prevent N+1 queries
                let profiles;
                if (context.dataloaders) {
                    // Use DataLoader for batch loading to prevent N+1 query problem
                    profiles = await Promise.all(
                        profileIds.map(id => context.dataloaders.profileById.load(id))
                    );
                } else {
                    // Fallback to direct database query if DataLoader not available
                    profiles = await Profile.find({ profileid: { $in: profileIds } });
                }
                
                return parent.viewers.map(viewer => ({
                    profileid: viewer.profileid,
                    profile: profiles.find(p => p && p.profileid === viewer.profileid),
                    viewedAt: viewer.viewedAt
                }));
            } catch (error) {
                console.error('Error fetching story viewers:', error);
                return [];
            }
        },
        viewersCount: (parent) => {
            return parent.viewers ? parent.viewers.length : 0;
        },
        isViewedByUser: (parent, args, context) => {
            if (!context.user) return false;
            return parent.viewers ? parent.viewers.some(viewer => viewer.profileid === context.user.profileid) : false;
        }
    },

    // StoryViewer field resolvers
    StoryViewer: {
        profile: async (parent, args, context) => {
            try {
                // 🚀 PERFORMANCE FIX: Use DataLoader to prevent N+1 queries
                if (context.dataloaders && parent.profileid) {
                    // Use DataLoader for batch loading to prevent N+1 query problem
                    return await context.dataloaders.profileById.load(parent.profileid);
                } else {
                    // Fallback to direct database query if DataLoader not available
                    const profile = await Profile.findOne({ profileid: parent.profileid });
                    return profile;
                }
            } catch (error) {
                console.error('Error fetching story viewer profile:', error);
                return null;
            }
        }
    },

    Query: {
        // Get stories for a specific user
        getStories: async (parent, { profileid }, context) => {
            try {
                const stories = await Story.find({
                    profileid: profileid || context.user.profileid,
                    isActive: true,
                    expiresAt: { $gt: new Date() }
                })
                .lean()
                .sort({ createdAt: -1 });

                return stories;
            } catch (error) {
                console.error('Error fetching stories:', error);
                throw new Error('Failed to fetch stories');
            }
        },

        // Get all active stories from users the current user follows
        getActiveStories: async (parent, args, context) => {
            try {
                if (!context.user) {
                    throw new Error('Authentication required');
                }

                // Get user's profile to find who they follow
                const userProfile = await Profile.findOne({ profileid: context.user.profileid });
                if (!userProfile) {
                    throw new Error('User profile not found');
                }

                // For now, get all active stories (later filter by following)
                // Use aggregation pipeline to avoid date casting issues
                const stories = await Story.aggregate([
                    {
                        $match: {
                            isActive: true,
                            expiresAt: { $gt: new Date() }
                        }
                    },
                    { $sort: { createdAt: -1 } },
                    { $limit: 20 }
                ]);

                // Group by profile
                const storiesByProfile = {};
                stories.forEach(story => {
                    if (!storiesByProfile[story.profileid]) {
                        storiesByProfile[story.profileid] = [];
                    }
                    storiesByProfile[story.profileid].push(story);
                });

                // Return latest story from each profile
                const latestStories = Object.values(storiesByProfile).map(profileStories => profileStories[0]);
                
                return latestStories;
            } catch (error) {
                console.error('Error fetching active stories:', error);
                throw new Error('Failed to fetch active stories');
            }
        },

        // Get a specific story by ID
        getStoryById: async (parent, { storyid }, context) => {
            try {
                const story = await Story.findOne({ 
                    storyid, 
                    isActive: true,
                    expiresAt: { $gt: new Date() }
                })
                .lean();

                if (!story) {
                    throw new Error('Story not found or expired');
                }

                return story;
            } catch (error) {
                console.error('Error fetching story by ID:', error);
                throw new Error('Failed to fetch story');
            }
        },

        // Get viewers of a specific story
        getStoryViewers: async (parent, { storyid }, context) => {
            try {
                const story = await Story.findOne({ storyid });
                
                if (!story) {
                    throw new Error('Story not found');
                }

                // Check if user owns this story
                if (story.profileid !== context.user.profileid) {
                    throw new Error('Unauthorized: Can only view your own story viewers');
                }

                const profileIds = story.viewers.map(viewer => viewer.profileid);
                
                // 🚀 PERFORMANCE FIX: Use DataLoader to prevent N+1 queries
                let profiles;
                if (context.dataloaders) {
                    // Use DataLoader for batch loading to prevent N+1 query problem
                    profiles = await Promise.all(
                        profileIds.map(id => context.dataloaders.profileById.load(id))
                    );
                } else {
                    // Fallback to direct database query if DataLoader not available
                    profiles = await Profile.find({ profileid: { $in: profileIds } });
                }
                
                return story.viewers.map(viewer => ({
                    profileid: viewer.profileid,
                    profile: profiles.find(p => p && p.profileid === viewer.profileid),
                    viewedAt: viewer.viewedAt
                }));
            } catch (error) {
                console.error('Error fetching story viewers:', error);
                throw new Error('Failed to fetch story viewers');
            }
        }
    },

    Mutation: {
        // Create a new story
        CreateStory: async (parent, { profileid, mediaUrl, mediaType, caption }, context) => {
            try {
                if (!context.user) {
                    throw new Error('Authentication required');
                }

                // Ensure user can only create stories for themselves
                if (profileid !== context.user.profileid) {
                    throw new Error('Unauthorized: Can only create stories for yourself');
                }

                const newStory = new Story({
                    storyid: uuidv4(),
                    profileid,
                    mediaUrl,
                    mediaType,
                    caption: caption || ''
                });

                await newStory.save();
                return newStory;
            } catch (error) {
                console.error('Error creating story:', error);
                throw new Error('Failed to create story');
            }
        },

        // Delete a story
        DeleteStory: async (parent, { storyid }, context) => {
            try {
                const story = await Story.findOne({ storyid });
                
                if (!story) {
                    throw new Error('Story not found');
                }

                // Check if user owns this story
                if (story.profileid !== context.user.profileid) {
                    throw new Error('Unauthorized: Can only delete your own stories');
                }

                story.isActive = false;
                await story.save();
                
                return story;
            } catch (error) {
                console.error('Error deleting story:', error);
                throw new Error('Failed to delete story');
            }
        },

        // View a story (mark as viewed)
        ViewStory: async (parent, { storyid }, context) => {
            try {
                if (!context.user) {
                    throw new Error('Authentication required');
                }

                const story = await Story.findOne({ 
                    storyid, 
                    isActive: true,
                    expiresAt: { $gt: new Date() }
                });
                
                if (!story) {
                    throw new Error('Story not found or expired');
                }

                // Don't add view if it's the story owner
                if (story.profileid === context.user.profileid) {
                    return story;
                }

                // Check if user already viewed this story
                const existingView = story.viewers.find(viewer => viewer.profileid === context.user.profileid);
                
                if (!existingView) {
                    story.viewers.push({
                        profileid: context.user.profileid,
                        viewedAt: new Date()
                    });
                    await story.save();
                }

                return story;
            } catch (error) {
                console.error('Error viewing story:', error);
                throw new Error('Failed to view story');
            }
        }
    }
};

export default StoryResolvers;
