const Notification = require('../models/Notification');
const Goal = require('../models/Goal');
const User = require('../models/User');
const { ApiError } = require('../utils/ApiError');
const { buildListOptions, buildMeta } = require('../utils/query');

const createNotification = async (userId, { type = 'system', title, message, meta }) =>
  Notification.create({ userId, type, title, message, meta });

// A missing/undefined preference counts as ON so existing users keep notifications.
const isNotificationsEnabled = async (userId, notificationsPref) => {
  if (notificationsPref !== undefined) return notificationsPref !== false;
  const user = await User.findById(userId).select('preferences.notifications').lean();
  return user?.preferences?.notifications !== false;
};

const generateGoalReminders = async (userId, notificationsPref) => {
  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  inThreeDays.setHours(23, 59, 59, 999);

  const dueGoals = await Goal.find({
    userId,
    status: 'active',
    deadline: { $gte: now, $lte: inThreeDays },
  }).select('_id title deadline');

  if (dueGoals.length === 0) return [];
  if (!(await isNotificationsEnabled(userId, notificationsPref))) return [];

  const existing = await Notification.find({
    userId,
    type: 'reminder',
    'meta.goalId': { $in: dueGoals.map((g) => g._id) },
  }).select('meta');

  const reminded = new Set(existing.map((n) => String(n.meta?.goalId)));
  const toCreate = dueGoals.filter((g) => !reminded.has(String(g._id)));

  const created = [];
  for (const goal of toCreate) {
    created.push(
      await createNotification(userId, {
        type: 'reminder',
        title: 'Goal deadline approaching',
        message: `Your goal "${goal.title}" is due on ${goal.deadline.toLocaleDateString()}.`,
        meta: { goalId: goal._id },
      })
    );
  }
  return created;
};

const list = async (userId, query, notificationsPref) => {
  await generateGoalReminders(userId, notificationsPref);

  const options = buildListOptions(query, { sortable: ['-createdAt', 'createdAt'], defaultSort: '-createdAt' });
  const filter = { userId };
  if (query.unread === 'true') filter.isRead = false;

  const [items, total] = await Promise.all([
    Notification.find(filter).sort(options.sort).skip(options.skip).limit(options.limit),
    Notification.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ ...options, total }) };
};

const getOwned = async (userId, id) => {
  const doc = await Notification.findOne({ _id: id, userId });
  if (!doc) {
    const exists = await Notification.exists({ _id: id });
    if (!exists) throw ApiError.notFound('Notification not found');
    throw ApiError.forbidden('You do not have permission to access this notification');
  }
  return doc;
};

const markRead = async (userId, id) => {
  const doc = await getOwned(userId, id);
  if (!doc.isRead) {
    doc.isRead = true;
    await doc.save();
  }
  return doc;
};

const markAllRead = async (userId) => {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
};

const remove = async (userId, id) => {
  const doc = await getOwned(userId, id);
  await doc.deleteOne();
  return doc;
};

const unreadCount = async (userId) => Notification.countDocuments({ userId, isRead: false });

module.exports = {
  createNotification,
  isNotificationsEnabled,
  list,
  getOwned,
  markRead,
  markAllRead,
  remove,
  unreadCount,
};