const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const hashPassword = async (plainPassword) => bcrypt.hash(plainPassword, SALT_ROUNDS);

const comparePassword = async (plainPassword, hash) => bcrypt.compare(plainPassword, hash);

// Hashes created with an older cost factor (e.g. 12) should be upgraded on next login.
const needsRehash = (hash) => bcrypt.getRounds(hash) !== SALT_ROUNDS;

module.exports = { hashPassword, comparePassword, needsRehash, SALT_ROUNDS };
