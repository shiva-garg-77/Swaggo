import { logger } from '../utils/SanitizedLogger.js';

/**
 * 🛡️ IP Whitelisting Middleware
 * 
 * Restricts access to admin endpoints based on IP address whitelist
 * 
 * Features:
 * - Configurable IP whitelist via environment variables
 * - Support for CIDR notation (e.g., 192.168.1.0/24)
 * - Support for individual IP addresses
 * - Detailed logging for security monitoring
 * - Graceful fallback for misconfigured environments
 */

class IPWhitelistMiddleware {
  constructor() {
    this.whitelist = this.loadWhitelist();
    this.enabled = this.whitelist.length > 0;
    
    if (this.enabled) {
      logger.info('IP Whitelisting enabled for admin endpoints', {
        whitelistedIPs: this.whitelist,
        count: this.whitelist.length
      });
    } else {
      logger.warn('IP Whitelisting DISABLED - No whitelisted IPs configured');
    }
  }
  
  /**
   * Load IP whitelist from environment variables
   * Supports both individual IPs and CIDR ranges
   */
  loadWhitelist() {
    const whitelistEnv = process.env.ADMIN_IP_WHITELIST;
    
    if (!whitelistEnv) {
      logger.warn('ADMIN_IP_WHITELIST not configured - IP whitelisting disabled');
      return [];
    }
    
    try {
      const ips = whitelistEnv.split(',')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0);
      
      logger.info('Loaded IP whitelist', { ips });
      return ips;
    } catch (error) {
      logger.error('Failed to parse ADMIN_IP_WHITELIST', {
        error: error.message,
        whitelistEnv
      });
      return [];
    }
  }
  
  /**
   * Check if an IP address matches a CIDR range
   */
  ipMatchesCIDR(ip, cidr) {
    try {
      // Split CIDR into IP and prefix length
      const [cidrIP, prefixLength] = cidr.split('/');
      
      if (!prefixLength) {
        // Not a CIDR, just compare IPs
        return ip === cidr;
      }
      
      // Convert IP addresses to integers for comparison
      const ipInt = this.ipToInteger(ip);
      const cidrInt = this.ipToInteger(cidrIP);
      const mask = ~((1 << (32 - parseInt(prefixLength))) - 1);
      
      return (ipInt & mask) === (cidrInt & mask);
    } catch (error) {
      logger.warn('Invalid CIDR format', {
        cidr,
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Convert IP address string to integer
   */
  ipToInteger(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }
  
  /**
   * Check if IP is whitelisted
   */
  isIPWhitelisted(ip) {
    // If whitelisting is disabled, allow all
    if (!this.enabled) {
      return true;
    }
    
    // Check if IP matches any whitelisted entry
    return this.whitelist.some(whitelistedIP => {
      return this.ipMatchesCIDR(ip, whitelistedIP);
    });
  }
  
  /**
   * Extract client IP address from request
   * Handles various proxy headers
   */
  extractClientIP(req) {
    // Check various headers for real IP
    const ipSources = [
      req.headers['x-forwarded-for'],
      req.headers['x-real-ip'],
      req.connection?.remoteAddress,
      req.socket?.remoteAddress,
      req.ip
    ];
    
    // Return first valid IP found
    for (const source of ipSources) {
      if (source) {
        // Handle x-forwarded-for which can contain multiple IPs
        const ip = source.split(',')[0].trim();
        if (this.isValidIP(ip)) {
          return ip;
        }
      }
    }
    
    // Fallback to localhost
    return '127.0.0.1';
  }
  
  /**
   * Validate IP address format
   */
  isValidIP(ip) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipv4Regex.test(ip) && ip.split('.').every(octet => parseInt(octet, 10) <= 255);
  }
  
  /**
   * Main middleware function
   */
  enforceWhitelist = (req, res, next) => {
    // If whitelisting is disabled, allow request
    if (!this.enabled) {
      return next();
    }
    
    const clientIP = this.extractClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const method = req.method;
    const url = req.url;
    
    // Check if IP is whitelisted
    if (this.isIPWhitelisted(clientIP)) {
      logger.debug('IP whitelist check passed', {
        clientIP,
        userAgent,
        method,
        url
      });
      return next();
    }
    
    // Log blocked request
    logger.warn('IP whitelist BLOCKED request', {
      clientIP,
      userAgent,
      method,
      url,
      whitelistedIPs: this.whitelist
    });
    
    // Return forbidden response
    return res.status(403).json({
      error: 'forbidden',
      message: 'Access denied - IP address not whitelisted for admin access',
      clientIP
    });
  };
  
  /**
   * Get middleware function for export
   */
  getMiddleware() {
    return this.enforceWhitelist;
  }
}

// Create singleton instance
const ipWhitelistMiddleware = new IPWhitelistMiddleware();

// Export middleware function
export default ipWhitelistMiddleware.getMiddleware();