import Highlight from '../../Models/FeedModels/Highlight.js';
import Story from '../../Models/FeedModels/Story.js';
import Profile from '../../Models/FeedModels/Profile.js';
import { v4 as uuidv4 } from 'uuid';

const HighlightResolvers = {
    // Highlight field resolvers
    Highlight: {
        profile: async (parent) => {
            try {
                const profile = await Profile.findOne({ profileid: parent.profileid });
                return profile;
            } catch (error) {
                console.error('Error fetching highlight profile:', error);
                return null;
            }
        },
        storyCount: (parent) => {
            return parent.stories ? parent.stories.length : 0;
        }
    },

    Query: {
        // Get highlights for a specific user
        getUserHighlights: async (parent, { profileid, limit }, context) => {
            try {
                const highlights = await Highlight.find({
                    profileid,
                    isActive: true
                }).sort({ createdAt: -1 }).limit(limit || 20);

                return highlights;
            } catch (error) {
                console.error('Error fetching highlights:', error);
                throw new Error('Failed to fetch highlights');
            }
        },

        // Search highlights for a user
        searchHighlights: async (parent, { profileid, query }, context) => {
            try {
                const highlights = await Highlight.find({
                    profileid,
                    isActive: true,
                    title: new RegExp(query, 'i')
                }).sort({ createdAt: -1 });

                return highlights;
            } catch (error) {
                console.error('Error searching highlights:', error);
                throw new Error('Failed to search highlights');
            }
        },
        
        // Get highlight stories
        getHighlightStories: async (parent, { highlightid }, context) => {
            try {
                const highlight = await Highlight.findOne({ 
                    highlightid,
                    isActive: true
                });

                if (!highlight) {
                    throw new Error('Highlight not found');
                }

                return highlight.stories || [];
            } catch (error) {
                console.error('Error fetching highlight stories:', error);
                throw new Error('Failed to fetch highlight stories');
            }
        }
    },

    Mutation: {
        // Create a new highlight
        createHighlightWithStories: async (parent, { input }, context) => {
            try {
                if (!context.user) {
                    throw new Error('Authentication required');
                }

                // Ensure user can only create highlights for themselves
                if (input.profileid !== context.user.profileid) {
                    throw new Error('Unauthorized: Can only create highlights for yourself');
                }

                const newHighlight = new Highlight({
                    highlightid: uuidv4(),
                    profileid: input.profileid,
                    title: input.title,
                    coverImage: input.coverImage || null,
                    category: input.category || null,
                    stories: []
                });

                await newHighlight.save();
                return newHighlight;
            } catch (error) {
                console.error('Error creating highlight:', error);
                throw new Error('Failed to create highlight');
            }
        },

        // Update an existing highlight
        updateHighlightContent: async (parent, { highlightid, input }, context) => {
            try {
                if (!context.user) {
                    throw new Error('Authentication required');
                }

                const highlight = await Highlight.findOne({ highlightid });
                if (!highlight) {
                    throw new Error('Highlight not found');
                }

                // Check if user owns this highlight
                if (highlight.profileid !== context.user.profileid) {
                    throw new Error('Unauthorized: Can only update your own highlights');
                }

                // Update fields
                if (input.title !== undefined) highlight.title = input.title;
                if (input.coverImage !== undefined) highlight.coverImage = input.coverImage;
                if (input.category !== undefined) highlight.category = input.category;

                await highlight.save();
                return highlight;
            } catch (error) {
                console.error('Error updating highlight:', error);
                throw new Error('Failed to update highlight');
            }
        },

        // Delete a highlight
        deleteHighlightWithStories: async (parent, { highlightid }, context) => {
            try {
                if (!context.user) {
                    throw new Error('Authentication required');
                }

                const highlight = await Highlight.findOne({ highlightid });
                if (!highlight) {
                    throw new Error('Highlight not found');
                }

                // Check if user owns this highlight
                if (highlight.profileid !== context.user.profileid) {
                    throw new Error('Unauthorized: Can only delete your own highlights');
                }

                highlight.isActive = false;
                await highlight.save();
                
                return {
                    success: true,
                    message: 'Highlight deleted successfully'
                };
            } catch (error) {
                console.error('Error deleting highlight:', error);
                throw new Error('Failed to delete highlight');
            }
        },

        // Add a story to a highlight
        addStoryToHighlight: async (parent, { highlightid, storyid }, context) => {
            try {
                if (!context.user) {
                    throw new Error('Authentication required');
                }

                const highlight = await Highlight.findOne({ highlightid });
                if (!highlight) {
                    throw new Error('Highlight not found');
                }

                // Check if user owns this highlight
                if (highlight.profileid !== context.user.profileid) {
                    throw new Error('Unauthorized: Can only modify your own highlights');
                }

                // Get the story
                const story = await Story.findOne({ storyid });
                if (!story) {
                    throw new Error('Story not found');
                }

                // Check if user owns the story
                if (story.profileid !== context.user.profileid) {
                    throw new Error('Unauthorized: Can only add your own stories to highlights');
                }

                // Add story to highlight using the model method
                const added = highlight.addStory({
                    storyid: story.storyid,
                    mediaUrl: story.mediaUrl,
                    mediaType: story.mediaType,
                    caption: story.caption,
                    createdAt: story.createdAt
                });

                if (!added) {
                    throw new Error('Story is already in this highlight');
                }

                await highlight.save();
                return highlight;
            } catch (error) {
                console.error('Error adding story to highlight:', error);
                throw new Error('Failed to add story to highlight');
            }
        },

        // Remove a story from a highlight
        removeStoryFromHighlight: async (parent, { highlightid, storyid }, context) => {
            try {
                if (!context.user) {
                    throw new Error('Authentication required');
                }

                const highlight = await Highlight.findOne({ highlightid });
                if (!highlight) {
                    throw new Error('Highlight not found');
                }

                // Check if user owns this highlight
                if (highlight.profileid !== context.user.profileid) {
                    throw new Error('Unauthorized: Can only modify your own highlights');
                }

                // Remove story from highlight using the model method
                const removed = highlight.removeStory(storyid);
                if (!removed) {
                    throw new Error('Story not found in this highlight');
                }

                await highlight.save();
                return highlight;
            } catch (error) {
                console.error('Error removing story from highlight:', error);
                throw new Error('Failed to remove story from highlight');
            }
        }
    }
};

export default HighlightResolvers;