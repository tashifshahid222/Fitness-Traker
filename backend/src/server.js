const { env } = require('./config/env');
const logger = require('./config/logger');
const connectDB = require('./config/db');
const app = require('./app');

const start = async () => {
  try {
    await connectDB();
  } catch (err) {
    if (env.NODE_ENV === 'production') {
      logger.error(`Fatal: unable to connect to MongoDB — ${err.message}`);
      process.exit(1);
    }
    logger.warn(`Starting without a MongoDB connection (${err.message})`);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason: reason?.stack || reason });
    shutdown('unhandledRejection');
  });
};

start();
