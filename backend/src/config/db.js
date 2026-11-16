const mongoose = require('mongoose');
const logger = require('./logger');
const { env } = require('./env');
const Session = require('../models/Session');

const connectDB = async () => {
  if (!env.MONGO_URI) {
    logger.warn('MONGO_URI is not set — skipping MongoDB connection');
    return null;
  }

  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(env.MONGO_URI, {
    autoIndex: env.NODE_ENV !== 'production',
  });
  await Session.createIndexes();

  logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  return conn;
};

module.exports = connectDB;
