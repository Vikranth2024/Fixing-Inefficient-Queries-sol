import { getProducts, getProductById } from './product.service.js';

export async function listProducts(req, res) {
  try {
    const result = await getProducts({
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      order: req.query.order,
      fields: req.query.fields,
    });
    res.json(result);
  } catch (err) {
    const status = err?.statusCode === 400 ? 400 : 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
  }
}

export async function getProduct(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID' });

    const product = await getProductById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    const status = err?.statusCode === 400 ? 400 : 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
  }
}