const SupportTicket = require('../models/SupportTicket');
const { ApiError } = require('../utils/ApiError');
const { buildListOptions, buildMeta } = require('../utils/query');

const list = async (userId, query) => {
  const options = buildListOptions(query, {
    sortable: ['-createdAt', 'createdAt', '-updatedAt'],
    defaultSort: '-createdAt',
  });

  const filter = { userId };
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    SupportTicket.find(filter).sort(options.sort).skip(options.skip).limit(options.limit),
    SupportTicket.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ ...options, total }) };
};

const getOwned = async (userId, id) => {
  const doc = await SupportTicket.findOne({ _id: id, userId });
  if (!doc) {
    const exists = await SupportTicket.exists({ _id: id });
    if (!exists) throw ApiError.notFound('Support ticket not found');
    throw ApiError.forbidden('You do not have permission to access this ticket');
  }
  return doc;
};

const getById = async (userId, id) => getOwned(userId, id);

const create = async (userId, data) => SupportTicket.create({ ...data, userId });

const update = async (userId, id, data) => {
  const ticket = await getOwned(userId, id);

  if (data.message) {
    const replySnippet = data.message.replace(/\s+/g, ' ').trim().slice(0, 200);
    ticket.message += `\n\n[Reply added ${new Date().toISOString()}]\n${replySnippet}`;
  }
  if (data.status === 'closed') ticket.status = 'closed';

  await ticket.save();
  return ticket;
};

module.exports = { list, getById, create, update };