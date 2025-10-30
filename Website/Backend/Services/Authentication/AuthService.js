import User from '../../Models/User.js';
import Profile from '../../Models/FeedModels/Profile.js';
import TokenService from './TokenService.js';
import BaseService from '../System/BaseService.js';
import { AuthenticationError, ValidationError, AuthorizationError } from '../../Helper/UnifiedErrorHandling.js';
import { v4 as uuidv4 } from 'uuid';
import ProfileRepository from '../../Repositories/ProfileRepository.js';

/**
 * @fileoverview Authentication service handling all authentication-related business logic
 * @module AuthService
 */

class AuthService extends BaseService {
  /**
   * @constructor
   * @description Initialize auth service
   */
  constructor() {
    super();
    // Repository will be injected by the DI container
    this.profileRepository = null;
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registered user and tokens
   */
  async register(userData) {
    return this.handleOperation(async () => {
      this.validateRequiredParams(userData, ['username', 'email', 'password']);
      
      const { username, email, password } = userData;
      
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ username }, { email }] 
      });
      
      if (existingUser) {
        throw new ValidationError('User with this username or email already exists');
      }
      
      // Validate password strength
      if (password.length < 12) {
        throw new ValidationError('Password must be at least 12 characters long');
      }
      
      // Generate IDs
      const userId = uuidv4();
      const profileId = userId; // Use same ID for both
      
      // Create user using the secure User model method
      const newUser = await User.createSecureUser({
        username,
        email,
        password
      });
      
      // Set the IDs and link
      newUser.id = userId;
      newUser.profileid = profileId; // ✅ Link to profile
      
      await newUser.save();
      
      // Create profile
      const newProfile = new Profile({
        profileid: profileId,
        userid: userId, // ✅ Link to user
        username,
        email,
        profilePic: 'https://www.tenforums.com/attachments/user-accounts-family-safety/322690d1615743307t-user-account-image-log-user.png',
        isVerified: false,
        isPrivate: false,
        isActive: true,
        accountStatus: 'active',
        role: 'user'
      });
      
      await newProfile.save();
      
      // Generate tokens
      const tokenContext = {
        ipAddress: 'unknown', // This would be provided by the controller
        userAgent: 'unknown'  // This would be provided by the controller
      };
      
      const accessToken = await TokenService.generateAccessToken(newUser, tokenContext);
      const refreshToken = await TokenService.generateRefreshToken(newUser, tokenContext);
      
      return {
        user: this.formatEntity(newUser),
        profile: this.formatEntity(newProfile),
        tokens: {
          accessToken,
          refreshToken
        }
      };
    }, 'register');
  }

  /**
   * Login user
   * @param {string} identifier - Username or email
   * @param {string} password - User password
   * @param {Object} context - Request context with IP and User-Agent
   * @returns {Promise<Object>} Logged in user and tokens
   */
  async login(identifier, password, context) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ identifier, password }, ['identifier', 'password']);
      
      // Find user by username or email using the secure method
      const user = await User.findByUsernameOrEmail(identifier);
      
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }
      
      // Check if account is locked
      if (user.isAccountLocked()) {
        throw new AuthenticationError('Account is locked');
      }
      
      // Verify password using Argon2 through the User model method
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        // Increment failed login attempts
        await user.incrementLoginAttempts();
        throw new AuthenticationError('Invalid credentials');
      }
      
      // Reset failed login attempts
      await user.resetLoginAttempts();
      
      // Update last login information
      user.updateLastLogin(context.ipAddress, context.userAgent);
      
      // Generate tokens
      const tokenContext = {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      };
      
      const accessToken = await TokenService.generateAccessToken(user, tokenContext);
      const refreshToken = await TokenService.generateRefreshToken(user, tokenContext);
      
      return {
        user: this.formatEntity(user),
        tokens: {
          accessToken,
          refreshToken
        }
      };
    }, 'login');
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @param {Object} context - Request context with IP and User-Agent
   * @returns {Promise<Object>} New access token
   */
  async refreshAccessToken(refreshToken, context) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ refreshToken }, ['refreshToken']);
      
      const tokenContext = {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      };
      
      const result = await TokenService.verifyRefreshToken(refreshToken, tokenContext);
      
      if (!result.valid) {
        throw new AuthenticationError('Invalid refresh token');
      }
      
      const newAccessToken = await TokenService.generateAccessToken(result.user, tokenContext);
      
      return {
        accessToken: newAccessToken
      };
    }, 'refreshAccessToken');
  }

  /**
   * Logout user
   * @param {string} refreshToken - Refresh token to invalidate
   * @returns {Promise<boolean>} Success status
   */
  async logout(refreshToken) {
    return this.handleOperation(async () => {
      if (refreshToken) {
        // Invalidate refresh token
        await TokenService.invalidateRefreshToken(refreshToken);
      }
      
      return true;
    }, 'logout');
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ userId, currentPassword, newPassword }, ['userId', 'currentPassword', 'newPassword']);
      
      // Validate new password strength
      if (newPassword.length < 6) {
        throw new ValidationError('New password must be at least 6 characters long');
      }
      
      const user = await User.findOne({ id: userId });
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      // Verify current password using Argon2 through the User model method
      const isPasswordValid = await user.verifyPassword(currentPassword);
      if (!isPasswordValid) {
        throw new ValidationError('Current password is incorrect');
      }
      
      // Hash new password using Argon2 through the User model method
      await user.hashPassword(newPassword);
      
      // Update user
      user.updatedAt = new Date();
      await user.save();
      
      return true;
    }, 'changePassword');
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<boolean>} Success status
   */
  async requestPasswordReset(email) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ email }, ['email']);
      
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists or not for security
        return true;
      }
      
      // Generate reset token (in a real implementation, this would be stored securely)
      const resetToken = uuidv4();
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
      
      // Store reset token (in a real implementation, this would be in a separate collection)
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetTokenExpiry;
      user.updatedAt = new Date();
      await user.save();
      
      // Send reset email (in a real implementation, this would send an actual email)
      this.logger.info('Password reset requested', { 
        userId: user.id, 
        email: user.email,
        resetToken // In a real implementation, this would not be logged
      });
      
      return true;
    }, 'requestPasswordReset');
  }

  /**
   * Reset password
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async resetPassword(token, newPassword) {
    return this.handleOperation(async () => {
      this.validateRequiredParams({ token, newPassword }, ['token', 'newPassword']);
      
      // Validate new password strength
      if (newPassword.length < 6) {
        throw new ValidationError('Password must be at least 6 characters long');
      }
      
      // Find user with valid reset token
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() }
      });
      
      if (!user) {
        throw new ValidationError('Password reset token is invalid or has expired');
      }
      
      // Hash new password using Argon2 through the User model method
      await user.hashPassword(newPassword);
      
      // Update password and clear reset token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.updatedAt = new Date();
      await user.save();
      
      return true;
    }, 'resetPassword');
  }
}

export default AuthService;