const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { env } = require('./config/env');
const { ApiError } = require('./utils/ApiError');
const logger = require('./config/logger');
const routes = require('./routes');
const notFound = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const { allowedOrigins } = require('./config/allowedOrigins');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow requests like Postman/curl
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.has(cleanOrigin)) {
        return callback(null, true);
      }
      return callback(ApiError.forbidden('Origin is not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Protection'],
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Health/root check for Render and uptime monitors
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Fitness Tracker API is running' });
});

app.head('/', (req, res) => {
  res.status(200).end();
});

if (env.NODE_ENV === 'production') {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.http(message.trim()),
      },
    })
  );
}

app.use('/api', apiLimiter);

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
