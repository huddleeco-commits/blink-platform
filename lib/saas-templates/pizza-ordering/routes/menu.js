/**
 * Menu API Routes
 * Public and admin endpoints for menu management
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth, requireStaff } = require('../middleware/auth');

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * GET /api/menu
 * Get full menu with categories and items
 */
router.get('/', async (req, res) => {
  try {
    // Get all active categories
    const categoriesResult = await db.query(`
      SELECT id, name, description, image_url, display_order
      FROM menu_categories
      WHERE is_active = true
      ORDER BY display_order ASC
    `);

    // Get all available items with variants
    const itemsResult = await db.query(`
      SELECT
        mi.id, mi.category_id, mi.name, mi.description,
        mi.base_price, mi.image_url, mi.thumbnail_url,
        mi.is_featured, mi.is_popular,
        mi.is_vegetarian, mi.is_vegan, mi.is_gluten_free,
        mi.allows_customization, mi.max_toppings,
        mi.avg_rating, mi.review_count,
        COALESCE(json_agg(
          json_build_object(
            'id', iv.id,
            'name', iv.name,
            'price_modifier', iv.price_modifier,
            'serves', iv.serves,
            'is_default', iv.is_default
          ) ORDER BY iv.display_order
        ) FILTER (WHERE iv.id IS NOT NULL), '[]') AS variants
      FROM menu_items mi
      LEFT JOIN item_variants iv ON iv.item_id = mi.id AND iv.is_available = true
      WHERE mi.is_available = true
      GROUP BY mi.id
      ORDER BY mi.is_featured DESC, mi.is_popular DESC, mi.name ASC
    `);

    // Get all available toppings
    const toppingsResult = await db.query(`
      SELECT id, name, category, price, is_premium, is_vegetarian, is_vegan
      FROM toppings
      WHERE is_available = true
      ORDER BY category, display_order, name
    `);

    // Organize items by category
    const categories = categoriesResult.rows.map(category => ({
      ...category,
      items: itemsResult.rows.filter(item => item.category_id === category.id)
    }));

    res.json({
      success: true,
      menu: {
        categories,
        toppings: toppingsResult.rows,
        featured: itemsResult.rows.filter(i => i.is_featured),
        popular: itemsResult.rows.filter(i => i.is_popular)
      }
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ success: false, error: 'Failed to load menu' });
  }
});

/**
 * GET /api/menu/item/:id
 * Get single menu item with full details
 */
router.get('/item/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const itemResult = await db.query(`
      SELECT
        mi.*,
        mc.name as category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mc.id = mi.category_id
      WHERE mi.id = $1
    `, [id]);

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const item = itemResult.rows[0];

    // Get variants
    const variantsResult = await db.query(`
      SELECT id, name, price_modifier, serves, is_default, display_order
      FROM item_variants
      WHERE item_id = $1 AND is_available = true
      ORDER BY display_order
    `, [id]);

    // Get recent reviews
    const reviewsResult = await db.query(`
      SELECT r.rating, r.review_text, r.created_at,
        c.first_name
      FROM reviews r
      LEFT JOIN customers c ON c.id = r.customer_id
      WHERE r.menu_item_id = $1 AND r.is_visible = true
      ORDER BY r.created_at DESC
      LIMIT 5
    `, [id]);

    res.json({
      success: true,
      item: {
        ...item,
        variants: variantsResult.rows,
        reviews: reviewsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ success: false, error: 'Failed to load item' });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * POST /api/menu/items
 * Create new menu item (admin only)
 */
router.post('/items', requireAuth, requireStaff('manager'), async (req, res) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const {
      category_id, name, description, base_price,
      image_url, thumbnail_url, is_featured, is_vegetarian,
      is_vegan, is_gluten_free, allows_customization, max_toppings,
      variants // Array of { name, price_modifier, serves, is_default }
    } = req.body;

    // Validate required fields
    if (!name || !base_price) {
      return res.status(400).json({ success: false, error: 'Name and base price required' });
    }

    // Insert menu item
    const itemResult = await client.query(`
      INSERT INTO menu_items (
        category_id, name, description, base_price,
        image_url, thumbnail_url, is_featured,
        is_vegetarian, is_vegan, is_gluten_free,
        allows_customization, max_toppings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      category_id, name, description, base_price,
      image_url, thumbnail_url, is_featured || false,
      is_vegetarian || false, is_vegan || false, is_gluten_free || false,
      allows_customization !== false, max_toppings || 10
    ]);

    const item = itemResult.rows[0];

    // Insert variants if provided
    if (variants && variants.length > 0) {
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        await client.query(`
          INSERT INTO item_variants (item_id, name, price_modifier, serves, is_default, display_order)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [item.id, v.name, v.price_modifier || 0, v.serves, v.is_default || false, i]);
      }
    }

    await client.query('COMMIT');

    res.json({ success: true, item });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating item:', error);
    res.status(500).json({ success: false, error: 'Failed to create item' });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/menu/items/:id
 * Update menu item (admin only)
 */
router.put('/items/:id', requireAuth, requireStaff('manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const allowedFields = [
      'category_id', 'name', 'description', 'base_price',
      'image_url', 'thumbnail_url', 'is_featured', 'is_available',
      'is_popular', 'is_vegetarian', 'is_vegan', 'is_gluten_free',
      'allows_customization', 'max_toppings'
    ];

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(updates[field]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    values.push(id);
    const result = await db.query(`
      UPDATE menu_items
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    res.json({ success: true, item: result.rows[0] });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, error: 'Failed to update item' });
  }
});

/**
 * DELETE /api/menu/items/:id
 * Soft delete menu item (admin only)
 */
router.delete('/items/:id', requireAuth, requireStaff('manager'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      UPDATE menu_items
      SET is_available = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    res.json({ success: true, message: 'Item removed from menu' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, error: 'Failed to delete item' });
  }
});

/**
 * POST /api/menu/categories
 * Create category (admin only)
 */
router.post('/categories', requireAuth, requireStaff('manager'), async (req, res) => {
  try {
    const { name, description, image_url, display_order } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Category name required' });
    }

    const result = await db.query(`
      INSERT INTO menu_categories (name, description, image_url, display_order)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, description, image_url, display_order || 0]);

    res.json({ success: true, category: result.rows[0] });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

/**
 * PUT /api/menu/categories/:id
 * Update category (admin only)
 */
router.put('/categories/:id', requireAuth, requireStaff('manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image_url, display_order, is_active } = req.body;

    const result = await db.query(`
      UPDATE menu_categories
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        image_url = COALESCE($3, image_url),
        display_order = COALESCE($4, display_order),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [name, description, image_url, display_order, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, category: result.rows[0] });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
});

/**
 * POST /api/menu/toppings
 * Create topping (admin only)
 */
router.post('/toppings', requireAuth, requireStaff('manager'), async (req, res) => {
  try {
    const { name, category, price, is_premium, is_vegetarian, is_vegan, display_order } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Topping name required' });
    }

    const result = await db.query(`
      INSERT INTO toppings (name, category, price, is_premium, is_vegetarian, is_vegan, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, category || 'topping', price || 0, is_premium || false, is_vegetarian !== false, is_vegan || false, display_order || 0]);

    res.json({ success: true, topping: result.rows[0] });
  } catch (error) {
    console.error('Error creating topping:', error);
    res.status(500).json({ success: false, error: 'Failed to create topping' });
  }
});

module.exports = router;
