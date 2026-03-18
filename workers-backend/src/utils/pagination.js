// GAP-09: Standardized Pagination Helper

export function parsePagination(c) {
  const url = new URL(c.req.url);
  let page = parseInt(url.searchParams.get('page')) || 1;
  let limit = parseInt(url.searchParams.get('limit')) || 20;
  const sort = url.searchParams.get('sort') || 'created_at';
  const order = (url.searchParams.get('order') || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const cursor = url.searchParams.get('cursor') || null;

  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  const offset = (page - 1) * limit;
  return { page, limit, offset, sort, order, cursor };
}

export function paginatedResponse(data, total, page, limit) {
  const pages = Math.ceil(total / limit);
  return {
    success: true,
    data,
    pagination: { page, limit, total, pages }
  };
}

export function buildPaginatedQuery(baseQuery, params, countQuery) {
  const { sort, order, limit, offset } = params;
  const allowedSorts = ['created_at', 'updated_at', 'name', 'status', 'amount', 'id'];
  const safeSort = allowedSorts.includes(sort) ? sort : 'created_at';
  const query = `${baseQuery} ORDER BY ${safeSort} ${order} LIMIT ${limit} OFFSET ${offset}`;
  return { query, countQuery: countQuery || baseQuery.replace(/SELECT .+? FROM/, 'SELECT COUNT(*) as total FROM') };
}
