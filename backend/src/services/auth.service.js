const User = require('../models/User');
const Session = require('../models/Session');
const { ApiError } = require('../utils/ApiError');
const { hashPassword, needsRehash } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const logger = require('../config/logger');
const crypto = require('crypto');

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const INVALID_REFRESH_MESSAGE = 'Invalid or expired refresh token';

const sanitizeUser = (user) => {
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  return obj;
};

const hashRefreshToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const tokensMatch = (left, right) =>
  left.length === right.length && crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));

const issueTokens = (user, sessionId) => ({
  accessToken: signAccessToken({
    userId: user._id.toString(),
    sessionId: sessionId.toString(),
  }),
  refreshToken: signRefreshToken({
    userId: user._id.toString(),
    sessionId: sessionId.toString(),
  }),
});

const register = async (input) => {
  const { name, username, email, password, profilePicture } = input;

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.toLowerCase();

  const [emailExists, usernameExists] = await Promise.all([
    User.exists({ email: normalizedEmail }),
    User.exists({ username: normalizedUsername }),
  ]);

  if (emailExists || usernameExists) {
    const errors = [];
    if (emailExists) errors.push({ field: 'email', message: 'Email is already registered' });
    if (usernameExists) errors.push({ field: 'username', message: 'Username is already taken' });
    throw ApiError.conflict('An account with that email or username already exists', errors);
  }

  const user = await User.create({
    name,
    username: normalizedUsername,
    email: normalizedEmail,
    password,
    profilePicture: profilePicture || undefined,
  });

  return { user: sanitizeUser(user) };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Older hashes used a higher cost factor. Upgrade them here so existing
  // accounts get faster logins too. updateOne skips the pre-save hashing hook,
  // otherwise the fresh hash would be hashed a second time.
  if (needsRehash(user.password)) {
    const passwordHash = await hashPassword(password);
    await User.updateOne({ _id: user._id }, { $set: { password: passwordHash } });
  }

  const session = new Session({
    userId: user._id,
    refreshTokenHash: 'pending',
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
  });
  const tokens = issueTokens(user, session._id);
  session.refreshTokenHash = hashRefreshToken(tokens.refreshToken);
  await session.save();

  return { user: sanitizeUser(user), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
};

const refresh = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized(INVALID_REFRESH_MESSAGE);
    }
    throw error;
  }

  const { userId, sessionId } = decoded;
  if (
    typeof userId !== 'string' ||
    typeof sessionId !== 'string' ||
    !/^[a-f\d]{24}$/i.test(userId) ||
    !/^[a-f\d]{24}$/i.test(sessionId)
  ) {
    throw ApiError.unauthorized(INVALID_REFRESH_MESSAGE);
  }

  const session = await Session.findOne({ _id: sessionId, userId }).select('+refreshTokenHash');
  if (!session || session.expiresAt <= new Date()) {
    throw ApiError.unauthorized(INVALID_REFRESH_MESSAGE);
  }

  const presentedHash = hashRefreshToken(refreshToken);
  if (!tokensMatch(presentedHash, session.refreshTokenHash)) {
    await Session.deleteOne({ _id: session._id, userId });
    logger.warn('Refresh token reuse detected; session deleted');
    throw ApiError.unauthorized(INVALID_REFRESH_MESSAGE);
  }

  const user = await User.findById(userId);
  if (!user) {
    await Session.deleteOne({ _id: session._id });
    throw ApiError.unauthorized(INVALID_REFRESH_MESSAGE);
  }

  const tokens = issueTokens(user, session._id);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const rotated = await Session.findOneAndUpdate(
    {
      _id: session._id,
      userId,
      refreshTokenHash: presentedHash,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: { refreshTokenHash: hashRefreshToken(tokens.refreshToken), expiresAt },
    },
    { new: true }
  );

  if (!rotated) {
    const deleted = await Session.deleteOne(
      { _id: session._id, userId, refreshTokenHash: { $ne: presentedHash } }
    );
    if (deleted.deletedCount > 0) logger.warn('Concurrent refresh detected; session deleted');
    throw ApiError.unauthorized(INVALID_REFRESH_MESSAGE);
  }

  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
};

const logout = async (sessionId) => {
  if (!sessionId) throw ApiError.unauthorized('Authentication required');
  await Session.findByIdAndDelete(sessionId);
};

const logoutAll = async (userId) => {
  await Session.deleteMany({ userId });
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return sanitizeUser(user);
};

module.exports = { register, login, refresh, logout, logoutAll, getMe };
