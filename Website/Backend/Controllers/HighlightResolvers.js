import Highlight from '../Models/FeedModels/Highlight.js';
import Story from '../Models/FeedModels/Story.js';
import Profile from '../Models/FeedModels/Profile.js';
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
        getHighlights: async (parent, { profileid }, context) => {
            try {
                const highlights = await Highlight.find({
                    profileid,
                    isActive: true
                }).sort({ createdAt: -1 });

                return highlights;
            } catch (error) {
                console.error('Error fetching highlights:', error);
                throw new Error('Failed to fetch highlights');
            }
        },

        // Get a specific highlight by ID
        getHighlightById: async (parent, { highlightid }, context) => {
            try {
                const highlight = await Highlight.findOne({ 
                    highlightid,
                    isActive: true
                });

                if (!highlight) {
                    throw new Error('Highlight not found');
                }

                return highlight;
            } catch (error) {
                console.error('Error fetching highlight by ID:', error);
                throw new Error('Failed to fetch highlight');
            }
        }
    },

    Mutation: {
        // Create a new highlight
        CreateHighlight: async (parent, { profileid, title, coverImage, category }, context) => {
            try {
                if (!context.user) {
                    throw new Error('Authentication required');
                }

                // Ensure user can only create highlights for themselves
                if (profileid !== context.user.profileid) {
                    throw new Error('Unauthorized: Can only create highlights for yourself');
                }

                const newHighlight = new Highlight({
                    highlightid: uuidv4(),
                    profileid,
                    title,
                    coverImage: coverImage || null,
                    category: category || null,
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
        UpdateHighlight: async (parent, { highlightid, title, coverImage, category }, context) => {
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
                if (title !== undefined) highlight.title = title;
                if (coverImage !== undefined) highlight.coverImage = coverImage;
                if (category !== undefined) highlight.category = category;

                await highlight.save();
                return highlight;
            } catch (error) {
                console.error('Error updating highlight:', error);
                throw new Error('Failed to update highlight');
            }
        },

        // Delete a highlight
        DeleteHighlight: async (parent, { highlightid }, context) => {
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
                
                return highlight;
            } catch (error) {
                console.error('Error deleting highlight:', error);
                throw new Error('Failed to delete highlight');
            }
        },

        // Add a story to a highlight
        AddStoryToHighlight: async (parent, { highlightid, storyid }, context) => {
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
        RemoveStoryFromHighlight: async (parent, { highlightid, storyid }, context) => {
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