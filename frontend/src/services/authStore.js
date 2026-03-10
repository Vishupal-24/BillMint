/**
 * Access Token Store
 * 
 * Stores the access token in memory for security.
 * The refresh token is stored in an HTTP-only cookie by the server.
 * 
 * This provides better security than localStorage as:
 * - Memory is not accessible via XSS attacks
 * - Token is automatically cleared on page refresh (but silently restored via refresh token)
 */

let accessToken = null;
let tokenExpiry = null;

/**
 * Set the access token and its expiry
 * @param {string} token - The JWT access token
 * @param {number} expiresIn - Expiry time in seconds (optional)
 */
export const setAccessToken = (token, expiresIn = null) => {
  accessToken = token;
  if (expiresIn) {
    tokenExpiry = Date.now() + expiresIn * 1000;
  }
};

/**
 * Get the current access token
 * @returns {string|null} The access token or null if not set
 */
export const getAccessToken = () => accessToken;

/**
 * Check if the access token is expired or about to expire
 * @param {number} bufferSeconds - Consider expired if within this many seconds of expiry
 * @returns {boolean} True if token is expired or will expire soon
 */
export const isAccessTokenExpired = (bufferSeconds = 60) => {
  if (!accessToken || !tokenExpiry) return true;
  return Date.now() >= tokenExpiry - bufferSeconds * 1000;
};

/**
 * Clear the access token (on logout or auth failure)
 */
export const clearAccessToken = () => {
  accessToken = null;
  tokenExpiry = null;
};

/**
 * Check if we have a valid access token
 * @returns {boolean} True if we have a non-expired access token
 */
export const hasValidAccessToken = () => {
  return !!accessToken && !isAccessTokenExpired();
};
