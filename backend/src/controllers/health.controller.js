const mongoose = require('mongoose');
const { sendSuccess } = require('../utils/apiResponse');

const getHealth = (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = dbStates[mongoose.connection.readyState] || 'unknown';

  sendSuccess(res, {
    message: 'Fitness Tracker API is running',
    data: {
      status: 'healthy',
      environment: process.env.NODE_ENV || 'development',
      database: dbState,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = { getHealth };
