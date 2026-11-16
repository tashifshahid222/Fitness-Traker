const Progress = require('../models/Progress');
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
  if (options.search) {
    const regex = new RegExp(escapeRegex(options.search), 'i');
    filter.$or = [{ notes: regex }, { 'performance.metric': regex }];
  }

  const [items, total] = await Promise.all([
    Progress.find(filter).sort(options.sort).skip(options.skip).limit(options.limit),
    Progress.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ ...options, total }) };
};

const getOwned = async (userId, id) => {
  const doc = await Progress.findOne({ _id: id, userId });
  if (!doc) {
    const exists = await Progress.exists({ _id: id });
    if (!exists) throw ApiError.notFound('Progress entry not found');
    throw ApiError.forbidden('You do not have permission to access this progress entry');
  }
  return doc;
};

const getById = async (userId, id) => getOwned(userId, id);

const create = async (userId, data) => Progress.create({ ...data, userId });

const update = async (userId, id, data) => {
  await getOwned(userId, id);
  return Progress.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
};

const remove = async (userId, id) => {
  await getOwned(userId, id);
  await Progress.deleteOne({ _id: id });
};

module.exports = { list, getById, create, update, remove };