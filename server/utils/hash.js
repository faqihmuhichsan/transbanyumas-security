/**
 * Bcrypt hash and compare utilities
 */
const bcrypt = require('bcryptjs');
const { bcryptRounds } = require('../config/auth');

/**
 * Hash a plain-text password
 * @param {string} password
 * @returns {string} hashed password
 */
function hashPassword(password) {
  return bcrypt.hashSync(password, bcryptRounds);
}

/**
 * Compare a plain-text password against a hash
 * @param {string} password
 * @param {string} hash
 * @returns {boolean}
 */
function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

module.exports = { hashPassword, comparePassword };
