import BaseRepository from './BaseRepository.js';
import Profile from '../Models/FeedModels/Profile.js';

/**
 * @fileoverview Profile repository handling all profile-related data operations
 * @module ProfileRepository
 */

class ProfileRepository extends BaseRepository {
  /**
   * @constructor
   * @description Initialize profile repository
   */
  constructor() {
    super(Profile);
  }

  /**
   * Get profile by profile ID
   * @param {string} profileId - Profile ID
   * @returns {Promise<Object>} Profile object
   */
  async getProfileById(profileId) {
    return this.findById(profileId, {
      lean: true
    });
  }

  /**
   * Get profiles by profile IDs
   * @param {Array<string>} profileIds - Array of profile IDs
   * @returns {Promise<Array>} Array of profiles
   */
  async getProfilesByIds(profileIds) {
    return this.find({
      profileid: { $in: profileIds }
    }, {
      lean: true
    });
  }

  /**
   * Get profile by username
   * @param {string} username - Username
   * @returns {Promise<Object>} Profile object
   */
  async getProfileByUsername(username) {
    return this.findOne({
      username: username
    }, {
      lean: true
    });
  }

  /**
   * Search profiles by query with pagination
   * @param {string} query - Search query
   * @param {Object} paginationOptions - Pagination options
   * @returns {Promise<Object>} Paginated profiles with metadata
   */
  async searchProfilesPaginated(query, paginationOptions = {}) {
    // 🔧 PAGINATION #83: Use the new paginate method
    return this.paginate({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    }, {
      sort: { createdAt: -1 },
      ...paginationOptions
    });
  }

  /**
   * Search profiles by query
   * @param {string} query - Search query
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of profiles
   */
  async searchProfiles(query, options = {}) {
    const { limit = 50, skip = 0 } = options;
    
    return this.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    }, {
      sort: { createdAt: -1 },
      limit,
      skip,
      lean: true
    });
  }

  /**
   * Update profile online status
   * @param {string} profileId - Profile ID
   * @param {boolean} isOnline - Online status
   * @returns {Promise<Object>} Updated profile
   */
  async updateOnlineStatus(profileId, isOnline) {
    return this.updateOne(
      { profileid: profileId },
      { 
        isOnline: isOnline,
        lastSeen: isOnline ? undefined : new Date()
      }
    );
  }

  /**
   * Update profile last seen
   * @param {string} profileId - Profile ID
   * @returns {Promise<Object>} Updated profile
   */
  async updateLastSeen(profileId) {
    return this.updateOne(
      { profileid: profileId },
      { 
        lastSeen: new Date()
      }
    );
  }

  /**
   * Follow a profile
   * @param {string} profileId - Profile ID
   * @param {string} targetProfileId - Target profile ID
   * @returns {Promise<Object>} Updated profile
   */
  async followProfile(profileId, targetProfileId) {
    // Add target to following list
    await this.updateOne(
      { profileid: profileId },
      { 
        $addToSet: { following: targetProfileId }
      }
    );
    
    // Add profile to target's followers list
    return this.updateOne(
      { profileid: targetProfileId },
      { 
        $addToSet: { followers: profileId }
      }
    );
  }

  /**
   * Unfollow a profile
   * @param {string} profileId - Profile ID
   * @param {string} targetProfileId - Target profile ID
   * @returns {Promise<Object>} Updated profile
   */
  async unfollowProfile(profileId, targetProfileId) {
    // Remove target from following list
    await this.updateOne(
      { profileid: profileId },
      { 
        $pull: { following: targetProfileId }
      }
    );
    
    // Remove profile from target's followers list
    return this.updateOne(
      { profileid: targetProfileId },
      { 
        $pull: { followers: profileId }
      }
    );
  }

  /**
   * Block a profile
   * @param {string} profileId - Profile ID
   * @param {string} targetProfileId - Target profile ID
   * @returns {Promise<Object>} Updated profile
   */
  async blockProfile(profileId, targetProfileId) {
    // Add target to blocked list
    await this.updateOne(
      { profileid: profileId },
      { 
        $addToSet: { blocked: targetProfileId }
      }
    );
    
    // Remove target from following list (if following)
    await this.updateOne(
      { profileid: profileId },
      { 
        $pull: { following: targetProfileId }
      }
    );
    
    // Remove profile from target's following list (if target was following)
    return this.updateOne(
      { profileid: targetProfileId },
      { 
        $pull: { following: profileId }
      }
    );
  }

  /**
   * Unblock a profile
   * @param {string} profileId - Profile ID
   * @param {string} targetProfileId - Target profile ID
   * @returns {Promise<Object>} Updated profile
   */
  async unblockProfile(profileId, targetProfileId) {
    // Remove target from blocked list
    return this.updateOne(
      { profileid: profileId },
      { 
        $pull: { blocked: targetProfileId }
      }
    );
  }
}

export default ProfileRepository;