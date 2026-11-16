const Goal = require('../models/Goal');
const Notification = require('../models/Notification');
const { ApiError } = require('../utils/ApiError');
const { buildListOptions, buildMeta, escapeRegex } = require('../utils/query');
const { createNotification, isNotificationsEnabled } = require('./notification.service');

const notifyIfAchieved = async (goal, userId, notificationsPref) => {
  if (goal.status !== 'active' || goal.currentValue < goal.targetValue) return;

  const alreadyNotified = await Notification.exists({
    userId,
    type: 'goal',
    'meta.goalId': goal._id,
  });
  if (alreadyNotified) return;

  // The goal is still marked achieved; only the notification is skipped.
  goal.status = 'completed';
  await goal.save();
  goal.progressPercent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));

  if (!(await isNotificationsEnabled(userId, notificationsPref))) return;

  await createNotification(userId, {
    type: 'goal',
    title: 'Goal achieved',
    message: `You reached your goal "${goal.title}". Well done!`,
    meta: { goalId: goal._id },
  });
};

const list = async (userId, query) => {
  const options = buildListOptions(query, {
    sortable: ['-createdAt', 'createdAt', '-deadline', 'deadline'],
    defaultSort: '-createdAt',
  });

  const filter = { userId };
  if (query.status) filter.status = query.status;
  if (options.search) {
    const regex = new RegExp(escapeRegex(options.search), 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const [items, total] = await Promise.all([
    Goal.find(filter).sort(options.sort).skip(options.skip).limit(options.limit),
    Goal.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ ...options, total }) };
};

const getOwned = async (userId, id) => {
  const doc = await Goal.findOne({ _id: id, userId });
  if (!doc) {
    const exists = await Goal.exists({ _id: id });
    if (!exists) throw ApiError.notFound('Goal not found');
    throw ApiError.forbidden('You do not have permission to access this goal');
  }
  return doc;
};

const getById = async (userId, id) => getOwned(userId, id);

const create = async (userId, data, notificationsPref) => {
  const goal = await Goal.create({ ...data, userId });
  await notifyIfAchieved(goal, userId, notificationsPref);
  return goal;
};

const update = async (userId, id, data, notificationsPref) => {
  await getOwned(userId, id);
  const goal = await Goal.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
  await notifyIfAchieved(goal, userId, notificationsPref);
  return goal;
};

const remove = async (userId, id) => {
  await getOwned(userId, id);
  await Goal.deleteOne({ _id: id });
};

module.exports = { list, getById, create, update, remove };