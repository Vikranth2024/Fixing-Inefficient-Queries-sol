import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MAX_LIMIT = 100;
const ALLOWED_SORT_FIELDS = ['name', 'price', 'createdAt', 'category', 'stock'];
const ALLOWED_SELECT_FIELDS = ['id', 'name', 'price', 'category', 'stock', 'imageUrl', 'description'];

function parsePage(page) {
  const n = Number(page);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

function parseLimit(limit) {
  const n = Number(limit);
  const clamped = Number.isInteger(n) && n >= 1 ? n : 20;
  return Math.min(clamped, MAX_LIMIT);
}

function parseSortBy(sortBy) {
  if (typeof sortBy === 'string' && ALLOWED_SORT_FIELDS.includes(sortBy)) {
    return sortBy;
  }
  if (sortBy !== undefined) {
    const error = new Error(`Invalid sortBy: "${sortBy}". Allowed: ${ALLOWED_SORT_FIELDS.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
  return 'createdAt';
}

function parseOrder(order) {
  if (order === 'asc' || order === 'desc') return order;
  return 'desc';
}

function parseFields(fields) {
  if (!fields || typeof fields !== 'string') return undefined;

  const requested = fields.split(',').map((f) => f.trim());
  const invalid = requested.filter((f) => !ALLOWED_SELECT_FIELDS.includes(f));

  if (invalid.length > 0) {
    const error = new Error(`Invalid fields: "${invalid.join(', ')}". Allowed: ${ALLOWED_SELECT_FIELDS.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
  return Object.fromEntries(requested.map((f) => [f, true]));
}

export async function getProducts(query) {
  const page = parsePage(query.page);
  const limit = parseLimit(query.limit);
  const sortBy = parseSortBy(query.sortBy);
  const order = parseOrder(query.order);
  const select = parseFields(query.fields);
  const skip = (page - 1) * limit;

  const findManyArgs = {
    skip,
    take: limit,
    orderBy: { [sortBy]: order },
    where: { isActive: true },
  };
  
  if (select) findManyArgs.select = select;

  const [products, total] = await Promise.all([
    prisma.product.findMany(findManyArgs),
    prisma.product.count({ where: { isActive: true } }),
  ]);

  return {
    data: products,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getProductById(id) {
  if (!Number.isInteger(id) || id < 1) {
    const error = new Error('Invalid product ID');
    error.statusCode = 400;
    throw error;
  }
  return prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, price: true, description: true, category: true, stock: true, imageUrl: true },
  });
}