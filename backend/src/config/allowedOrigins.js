const { env } = require('./env');

const normalizeOrigin = (origin) => origin.replace(/\/+$/, '');
const localClientUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(env.CLIENT_URL);
const configuredOrigins = env.NODE_ENV === 'production' && localClientUrl ? [] : [env.CLIENT_URL];
const localOrigins = env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const allowedOrigins = new Set(
  [
    ...configuredOrigins,
    ...localOrigins,
  ]
    .filter(Boolean)
    .map(normalizeOrigin)
);

const isAllowedOrigin = (origin) => allowedOrigins.has(normalizeOrigin(origin));

module.exports = { allowedOrigins, isAllowedOrigin };
