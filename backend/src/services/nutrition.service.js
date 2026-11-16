const Nutrition = require('../models/Nutrition');
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
  if (query.mealType) filter.mealType = query.mealType;
  if (options.search) {
    const regex = new RegExp(escapeRegex(options.search), 'i');
    filter.$or = [{ foodItems: { $in: [regex] } }, { notes: regex }, { quantity: regex }];
  }

  const [items, total] = await Promise.all([
    Nutrition.find(filter).sort(options.sort).skip(options.skip).limit(options.limit),
    Nutrition.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ ...options, total }) };
};

const getOwned = async (userId, id) => {
  const doc = await Nutrition.findOne({ _id: id, userId });
  if (!doc) {
    const exists = await Nutrition.exists({ _id: id });
    if (!exists) throw ApiError.notFound('Nutrition entry not found');
    throw ApiError.forbidden('You do not have permission to access this nutrition entry');
  }
  return doc;
};

const getById = async (userId, id) => getOwned(userId, id);

const create = async (userId, data) => Nutrition.create({ ...data, userId });

const update = async (userId, id, data) => {
  await getOwned(userId, id);
  return Nutrition.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
};

const remove = async (userId, id) => {
  await getOwned(userId, id);
  await Nutrition.deleteOne({ _id: id });
};

module.exports = { list, getById, create, update, remove };