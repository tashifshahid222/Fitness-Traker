const User = require('../models/User');
const Workout = require('../models/Workout');
const Nutrition = require('../models/Nutrition');
const Progress = require('../models/Progress');
const Goal = require('../models/Goal');
const Notification = require('../models/Notification');
const SupportTicket = require('../models/SupportTicket');
const Session = require('../models/Session');
const { ApiError } = require('../utils/ApiError');

const sanitize = (user) => {
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  return obj;
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return sanitize(user);
};

const updateProfile = async (userId, updates) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  if (updates.username && updates.username.toLowerCase() !== user.username) {
    const taken = await User.exists({ username: updates.username.toLowerCase(), _id: { $ne: user._id } });
    if (taken) {
      throw ApiError.conflict('Username is already taken', [{ field: 'username', message: 'Username is already taken' }]);
    }
    user.username = updates.username.toLowerCase();
  }

  if (updates.name) user.name = updates.name;
  if (updates.profilePicture !== undefined) user.profilePicture = updates.profilePicture;

  if (updates.preferences) {
    if (updates.preferences.theme) user.preferences.theme = updates.preferences.theme;
    if (updates.preferences.weightUnit) user.preferences.weightUnit = updates.preferences.weightUnit;
    if (updates.preferences.notifications !== undefined) {
      user.preferences.notifications = updates.preferences.notifications;
    }
    if (updates.preferences.workoutReminders !== undefined) {
      user.preferences.workoutReminders = updates.preferences.workoutReminders;
    }
    if (updates.preferences.mealReminders !== undefined) {
      user.preferences.mealReminders = updates.preferences.mealReminders;
    }
  }

  await user.save();
  return sanitize(user);
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');
  if (!(await user.matchPassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
};

const deleteAccount = async (userId, { password }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');
  if (!(await user.matchPassword(password))) {
    throw ApiError.badRequest('Password is incorrect');
  }

  const ownedCollections = [Workout, Nutrition, Progress, Goal, Notification, SupportTicket];
  await Session.deleteMany({ userId });
  for (const model of ownedCollections) {
    await model.deleteMany({ userId });
  }
  await User.deleteOne({ _id: userId });
};

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };