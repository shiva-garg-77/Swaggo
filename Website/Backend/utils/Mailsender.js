import OAuth2EmailService from '../Services/OAuth2EmailService.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize OAuth2 email service
const emailService = new OAuth2EmailService();

/**
 * Send email using OAuth2 authentication (secure)
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} content - Email HTML content
 * @param {string} senderEmail - Sender's email address (Gmail account)
 * @param {string} accessToken - OAuth2 access token
 * @param {string} refreshToken - OAuth2 refresh token
 * @returns {Promise<Object>} Send result
 */
const Sendmailer = async (email, subject, content, senderEmail, accessToken, refreshToken) => {
    try {
        // Set OAuth2 credentials
        emailService.setCredentials(accessToken, refreshToken);
        
        // Send email using OAuth2
        const result = await emailService.sendEmail(
            {
                to: email,
                subject: subject,
                html: content
            },
            senderEmail
        );
        
        console.log("Email sent successfully", result.messageId);
        return result;
    } catch (error) {
        console.error("Failed to send email:", error);
        throw error;
    }
};

/**
 * Get OAuth2 authorization URL for Gmail setup
 * @param {string} userEmail - User's email address
 * @returns {string} Authorization URL
 */
const getAuthUrl = (userEmail) => {
    try {
        return emailService.getAuthUrl(userEmail);
    } catch (error) {
        console.error("Failed to generate auth URL:", error);
        throw error;
    }
};

/**
 * Exchange authorization code for OAuth2 tokens
 * @param {string} code - Authorization code from OAuth2 callback
 * @returns {Promise<Object>} Tokens
 */
const exchangeCodeForTokens = async (code) => {
    try {
        return await emailService.exchangeCodeForTokens(code);
    } catch (error) {
        console.error("Failed to exchange code for tokens:", error);
        throw error;
    }
};

export default Sendmailer;
export { getAuthUrl, exchangeCodeForTokens };