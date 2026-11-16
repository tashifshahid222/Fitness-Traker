const Workout = require('../models/Workout');
const { ApiError } = require('../utils/ApiError');
const { buildListOptions, buildMeta, escapeRegex } = require('../utils/query');

const list = async (userId, query) => {
  const options = buildListOptions(query, { sortable: ['-date', 'date', '-createdAt', 'createdAt'], defaultSort: '-date' });

  const filter = { userId };
  if (options.from || options.to) {
    filter.date = {};
    if (options.from) filter.date.$gte = options.from;
    if (options.to) filter.date.$lte = options.to;
  }
  if (query.category) filter.category = query.category;
  if (options.search) {
    const regex = new RegExp(escapeRegex(options.search), 'i');
    filter.$or = [{ exerciseName: regex }, { notes: regex }, { tags: { $in: [regex] } }];
  }

  const [items, total] = await Promise.all([
    Workout.find(filter).sort(options.sort).skip(options.skip).limit(options.limit),
    Workout.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ ...options, total }) };
};

const getOwned = async (userId, id) => {
  const doc = await Workout.findOne({ _id: id, userId });
  if (!doc) {
    const exists = await Workout.exists({ _id: id });
    if (!exists) throw ApiError.notFound('Workout not found');
    throw ApiError.forbidden('You do not have permission to access this workout');
  }
  return doc;
};

const getById = async (userId, id) => getOwned(userId, id);

const create = async (userId, data) => Workout.create({ ...data, userId });

const update = async (userId, id, data) => {
  await getOwned(userId, id);
  return Workout.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
};

const remove = async (userId, id) => {
  await getOwned(userId, id);
  await Workout.deleteOne({ _id: id });
};

module.exports = { list, getById, create, update, remove };