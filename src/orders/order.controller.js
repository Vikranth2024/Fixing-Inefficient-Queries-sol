import { getOrders, getOrderById } from './order.service.js';

export async function listOrders(req, res) {
  try {
    const result = await getOrders({
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      order: req.query.order
    });
    res.json(result);
  } catch (err) {
    const status = err?.statusCode === 400 ? 400 : 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
  }
}

export async function getOrder(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid order ID' });

    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    const status = err?.statusCode === 400 ? 400 : 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
  }
}