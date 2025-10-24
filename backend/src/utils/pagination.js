function parsePagination(query) {
  const limit = Math.min(parseInt(query.limit || '50', 10), 100);
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const skip = (page - 1) * limit;
  return { limit, page, skip };
}
module.exports = { parsePagination };