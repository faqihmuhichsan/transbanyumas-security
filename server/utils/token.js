/**
 * JWT sign and verify utilities
 */
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn, jwtRefreshExpiresIn } = require('../config/auth');

/**
 * Generate an access token
 * @param {object} payload - { id, username, role }
 * @returns {string} JWT token
 */
function signAccessToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
}

/**
 * Generate a refresh token
 * @param {object} payload - { id, username, role }
 * @returns {string} JWT refresh token
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtRefreshExpiresIn });
}

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {object} decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = { signAccessToken, signRefreshToken, verifyToken };
