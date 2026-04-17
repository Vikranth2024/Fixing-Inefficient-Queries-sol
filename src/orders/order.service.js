import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : [],
});

const ALLOWED_ORDER_SORT_FIELDS = ['createdAt', 'totalAmount', 'status'];

function parseSortBy(sortBy) {
  if (typeof sortBy === 'string' && ALLOWED_ORDER_SORT_FIELDS.includes(sortBy)) return sortBy;
  if (sortBy !== undefined) {
    const error = new Error(`Invalid sortBy: "${sortBy}". Allowed: ${ALLOWED_ORDER_SORT_FIELDS.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
  return 'createdAt';
}

export async function getOrders(query = {}) {
  const sortBy = parseSortBy(query.sortBy);
  const order = query.order === 'asc' ? 'asc' : 'desc';
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(Math.max(1, Number(query.limit) || 20), 100);
  const skip = (page - 1) * limit;

  // ✅ 1 Query: N+1 Fixed using Prisma 'include'
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      skip, take: limit, orderBy: { [sortBy]: order },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { id: true, name: true, price: true } } } },
      },
    }),
    prisma.order.count(),
  ]);

  return { data: orders, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getOrderById(id) {
  if (!Number.isInteger(id) || id < 1) {
    const error = new Error('Invalid order ID');
    error.statusCode = 400;
    throw error;
  }
  return prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { product: { select: { id: true, name: true, price: true } } } },
    },
  });
}