/**
 * OAuth2 Email Service - Secure email sending using Gmail OAuth2
 * 
 * This service provides secure email functionality using OAuth2 authentication
 * instead of plain text credentials, preventing credential exposure.
 * 
 * @module OAuth2EmailService
 * @version 1.0.0
 */

import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { logger } from '../utils/SanitizedLogger.js';
// Remove injectable decorator for simpler testing
// import { injectable } from 'inversify';

/**
 * OAuth2 Email Service Class
 * Implements secure email sending using Gmail OAuth2
 */
// @injectable() - Remove decorator for simpler implementation
class OAuth2EmailService {
  /**
   * Initialize OAuth2 Email Service
   */
  constructor() {
    this.oauth2Client = null;
    this.transporter = null;
    
    // Initialize OAuth2 client if credentials are available
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      this.initializeOAuth2Client();
    }
  }
  
  /**
   * Initialize OAuth2 client with credentials
   */
  initializeOAuth2Client() {
    try {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback'
      );
      
      logger.info('OAuth2 Email Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OAuth2 Email Service:', error);
      throw error;
    }
  }
  
  /**
   * Set OAuth2 credentials for sending emails
   * @param {string} accessToken - OAuth2 access token
   * @param {string} refreshToken - OAuth2 refresh token
   */
  setCredentials(accessToken, refreshToken) {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.');
    }
    
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  }
  
  /**
   * Refresh OAuth2 access token
   * @returns {Promise<Object>} Refreshed credentials
   */
  async refreshAccessToken() {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized.');
    }
    
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      logger.info('OAuth2 access token refreshed successfully');
      return credentials;
    } catch (error) {
      logger.error('Failed to refresh OAuth2 access token:', error);
      throw error;
    }
  }
  
  /**
   * Initialize email transporter with OAuth2
   * @param {string} userEmail - User's email address
   */
  initializeTransporter(userEmail) {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized.');
    }
    
    try {
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: userEmail,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: this.oauth2Client.credentials.refresh_token,
          accessToken: this.oauth2Client.credentials.access_token
        }
      });
      
      logger.info(`Email transporter initialized for user: ${userEmail}`);
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      throw error;
    }
  }
  
  /**
   * Send email using OAuth2 authentication
   * @param {Object} emailOptions - Email options { to, subject, html, text }
   * @param {string} userEmail - Sender's email address
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(emailOptions, userEmail) {
    if (!this.transporter) {
      this.initializeTransporter(userEmail);
    }
    
    try {
      // Prepare email message
      const mailOptions = {
        from: userEmail,
        to: emailOptions.to,
        subject: emailOptions.subject,
        html: emailOptions.html,
        text: emailOptions.text
      };
      
      // Send email
      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to: ${emailOptions.to}`, { messageId: result.messageId });
      return result;
    } catch (error) {
      logger.error('Failed to send email:', error);
      
      // If it's an authentication error, try to refresh token and retry
      if (error.code === 'EAUTH' || error.message.includes('authentication')) {
        logger.info('Attempting to refresh OAuth2 token and retry');
        try {
          await this.refreshAccessToken();
          this.initializeTransporter(userEmail);
          
          // Retry sending email
          const mailOptions = {
            from: userEmail,
            to: emailOptions.to,
            subject: emailOptions.subject,
            html: emailOptions.html,
            text: emailOptions.text
          };
          
          const result = await this.transporter.sendMail(mailOptions);
          logger.info(`Email sent successfully after token refresh to: ${emailOptions.to}`, { messageId: result.messageId });
          return result;
        } catch (refreshError) {
          logger.error('Failed to send email after token refresh:', refreshError);
          throw refreshError;
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Get OAuth2 authorization URL for Gmail
   * @param {string} userEmail - User's email address
   * @returns {string} Authorization URL
   */
  getAuthUrl(userEmail) {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized.');
    }
    
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://mail.google.com/',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose'
      ],
      state: userEmail
    });
    
    logger.info(`Generated OAuth2 authorization URL for user: ${userEmail}`);
    return authUrl;
  }
  
  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from OAuth2 callback
   * @returns {Promise<Object>} Tokens { access_token, refresh_token, expiry_date }
   */
  async exchangeCodeForTokens(code) {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized.');
    }
    
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      logger.info('Successfully exchanged authorization code for tokens');
      return tokens;
    } catch (error) {
      logger.error('Failed to exchange authorization code for tokens:', error);
      throw error;
    }
  }
  
  /**
   * Verify email transporter is working
   * @returns {Promise<boolean>} Verification result
   */
  async verifyTransporter() {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized.');
    }
    
    try {
      await this.transporter.verify();
      logger.info('Email transporter verified successfully');
      return true;
    } catch (error) {
      logger.error('Email transporter verification failed:', error);
      return false;
    }
  }
}

export default OAuth2EmailService;