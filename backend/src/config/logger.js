const fs = require('fs');
const path = require('path');
const winston = require('winston');
const { env } = require('./env');

const logsDir = path.join(__dirname, '..', '..', 'logs');
fs.mkdirSync(logsDir, { recursive: true });

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    const text = stack || (typeof message === 'object' ? JSON.stringify(message) : message);
    return `${timestamp} ${level.toUpperCase()} ${text}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const httpOnlyFormat = winston.format.combine(
  winston.format((info) => (info.level === 'http' ? info : false))(),
  winston.format.timestamp(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: env.LOG_LEVEL || (env.NODE_ENV === 'production' ? 'info' : 'http'),
  levels,
  silent: env.NODE_ENV === 'test',
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      tailable: true,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      level: 'http',
      format: fileFormat,
      tailable: true,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      format: httpOnlyFormat,
      tailable: true,
    }),
  ],
});

module.exports = logger;
