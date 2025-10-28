import { logger } from '../../utils/SanitizedLogger.js';
import ipaddr from 'ipaddr.js';

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
   * Validate IP address format
   */
  isValidIP(ip) {
    try {
      // Use ipaddr.js for better IP validation including IPv6
      ipaddr.process(ip);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Check if an IP address matches a CIDR range or exact IP
   */
  ipMatchesCIDR(ip, cidr) {
    try {
      // Parse both IP and CIDR using ipaddr.js for IPv4/IPv6 support
      const parsedIP = ipaddr.process(ip);
      
      // Check if it's a single IP (no CIDR)
      if (!cidr.includes('/')) {
        const parsedCIDR = ipaddr.process(cidr);
        // Compare IP versions and addresses
        return parsedIP.kind() === parsedCIDR.kind() && parsedIP.toString() === parsedCIDR.toString();
      }
      
      // Handle CIDR notation
      const [cidrIP, prefixLength] = cidr.split('/');
      const parsedCIDR = ipaddr.process(cidrIP);
      
      // Ensure both IPs are the same version
      if (parsedIP.kind() !== parsedCIDR.kind()) {
        return false;
      }
      
      // Convert to match IP version
      if (parsedIP.kind() === 'ipv4' && parsedCIDR.kind() === 'ipv6') {
        // Convert IPv4 to IPv6 if needed
        if (parsedCIDR.isIPv4MappedAddress()) {
          parsedCIDR = parsedCIDR.toIPv4Address();
        } else {
          return false;
        }
      }
      
      // Check if IP is in subnet
      return parsedIP.match(parsedCIDR, parseInt(prefixLength));
    } catch (error) {
      logger.warn('Invalid IP or CIDR format', {
        ip,
        cidr,
        error: error.message
      });
      return false;
    }
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