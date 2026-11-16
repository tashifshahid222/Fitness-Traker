const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

const ISSUER = 'fitness-tracker-api';
const AUDIENCE = 'fitness-tracker-client';

const signAccessToken = (payload) =>
  jwt.sign({ ...payload, tokenType: 'access' }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15m',
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithm: 'HS256',
  });

const signRefreshToken = (payload) =>
  jwt.sign({ ...payload, tokenType: 'refresh' }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithm: 'HS256',
  });

const verifyToken = (token, secret, tokenType) => {
  const decoded = jwt.verify(token, secret, {
    algorithms: ['HS256'],
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  if (decoded.tokenType !== tokenType) {
    throw new jwt.JsonWebTokenError('Invalid token');
  }
  return decoded;
};

const verifyAccessToken = (token) => verifyToken(token, env.ACCESS_TOKEN_SECRET, 'access');
const verifyRefreshToken = (token) => verifyToken(token, env.REFRESH_TOKEN_SECRET, 'refresh');

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
