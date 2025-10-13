/**
 * 🚀 CDN Asset Resolver
 * 
 * Utility for resolving asset URLs with CDN support
 */

/**
 * Resolve asset URL with CDN support
 * @param {string} assetPath - Path to the asset
 * @returns {string} Resolved asset URL
 */
export function resolveAssetUrl(assetPath) {
  // Remove leading slash if present to normalize path
  const normalizedPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  
  // If CDN is enabled and we have a base URL, use CDN
  if (process.env.NEXT_PUBLIC_ENABLE_CDN === 'true' && process.env.NEXT_PUBLIC_CDN_BASE_URL) {
    // Ensure CDN URL doesn't end with slash
    const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_BASE_URL.endsWith('/') 
      ? process.env.NEXT_PUBLIC_CDN_BASE_URL.slice(0, -1) 
      : process.env.NEXT_PUBLIC_CDN_BASE_URL;
    
    // Add version parameter for cache busting if available
    const version = process.env.NEXT_PUBLIC_ASSET_VERSION;
    const versionParam = version ? `?v=${version}` : '';
    
    return `${cdnBaseUrl}/${normalizedPath}${versionParam}`;
  }
  
  // Fallback to local serving
  return `/${normalizedPath}`;
}

/**
 * Resolve upload URL with CDN support
 * @param {string} filename - Name of the uploaded file
 * @returns {string} Resolved upload URL
 */
export function resolveUploadUrl(filename) {
  // If CDN is enabled for uploads and we have a base URL, use CDN
  if (process.env.NEXT_PUBLIC_ENABLE_CDN === 'true' && process.env.NEXT_PUBLIC_CDN_BASE_URL) {
    // Ensure CDN URL doesn't end with slash
    const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_BASE_URL.endsWith('/') 
      ? process.env.NEXT_PUBLIC_CDN_BASE_URL.slice(0, -1) 
      : process.env.NEXT_PUBLIC_CDN_BASE_URL;
    
    // Add version parameter for cache busting if available
    const version = process.env.NEXT_PUBLIC_ASSET_VERSION;
    const versionParam = version ? `?v=${version}` : '';
    
    return `${cdnBaseUrl}/uploads/${filename}${versionParam}`;
  }
  
  // Fallback to local serving
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:45799';
  return `${baseUrl}/uploads/${filename}`;
}

/**
 * Check if CDN is enabled
 * @returns {boolean} Whether CDN is enabled
 */
export function isCdnEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_CDN === 'true';
}

/**
 * Get CDN base URL
 * @returns {string|null} CDN base URL or null if not enabled
 */
export function getCdnBaseUrl() {
  return isCdnEnabled() ? process.env.NEXT_PUBLIC_CDN_BASE_URL : null;
}

/**
 * Get asset version for cache busting
 * @returns {string} Asset version
 */
export function getAssetVersion() {
  return process.env.NEXT_PUBLIC_ASSET_VERSION || Date.now().toString();
}

export default {
  resolveAssetUrl,
  resolveUploadUrl,
  isCdnEnabled,
  getCdnBaseUrl,
  getAssetVersion
};