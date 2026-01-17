/**
 * Orders API Routes
 * Complete order lifecycle management
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { requireAuth, requireStaff, optionalAuth } = require('../middleware/auth');

// ============================================
// CUSTOMER ORDER ENDPOINTS
// ============================================

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', optionalAuth, async (req, res) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const {
      items, // Array of { item_id, variant_id, quantity, toppings: [{id, modifier_type}], special_instructions }
      order_type, // delivery, pickup, dine_in
      delivery_address_id,
      delivery_address, // For guest checkout: { street_address, city, state, zip_code, ... }
      scheduled_for,
      special_instructions,
      promo_code,
      tip_amount,
      payment_method, // card, cash
      customer_info // For guests: { email, first_name, last_name, phone }
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Order must contain at least one item' });
    }

    // Get or create customer
    let customerId = null;
    let customerEmail = null;

    if (req.user) {
      // Logged-in user
      const customerResult = await client.query(
        'SELECT id, email FROM customers WHERE user_id = $1',
        [req.user.id]
      );
      if (customerResult.rows.length > 0) {
        customerId = customerResult.rows[0].id;
        customerEmail = customerResult.rows[0].email;
      }
    } else if (customer_info?.email) {
      // Guest checkout - find or create customer
      customerEmail = customer_info.email;
      const existingCustomer = await client.query(
        'SELECT id FROM customers WHERE email = $1 AND user_id IS NULL',
        [customer_info.email]
      );

      if (existingCustomer.rows.length > 0) {
        customerId = existingCustomer.rows[0].id;
      } else {
        const newCustomer = await client.query(`
          INSERT INTO customers (email, first_name, last_name, phone)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [customer_info.email, customer_info.first_name, customer_info.last_name, customer_info.phone]);
        customerId = newCustomer.rows[0].id;
      }
    }

    // Handle delivery address
    let deliveryAddressId = delivery_address_id;
    let deliveryAddressSnapshot = null;

    if (order_type === 'delivery') {
      if (delivery_address && !delivery_address_id) {
        // Create new address for guest or new address for user
        const addrResult = await client.query(`
          INSERT INTO customer_addresses (customer_id, street_address, apartment, city, state, zip_code, delivery_instructions)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          customerId,
          delivery_address.street_address,
          delivery_address.apartment,
          delivery_address.city,
          delivery_address.state,
          delivery_address.zip_code,
          delivery_address.delivery_instructions
        ]);
        deliveryAddressId = addrResult.rows[0].id;
        deliveryAddressSnapshot = addrResult.rows[0];
      } else if (delivery_address_id) {
        // Get existing address snapshot
        const addrResult = await client.query(
          'SELECT * FROM customer_addresses WHERE id = $1',
          [delivery_address_id]
        );
        if (addrResult.rows.length > 0) {
          deliveryAddressSnapshot = addrResult.rows[0];
        }
      }

      if (!deliveryAddressSnapshot) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Delivery address required' });
      }
    }

    // Get store settings
    const settingsResult = await client.query(`
      SELECT key, value FROM store_settings WHERE key IN ('tax_rate', 'delivery_fee', 'minimum_order', 'estimated_prep_time_minutes')
    `);
    const settings = {};
    settingsResult.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    const taxRate = parseFloat(settings.tax_rate || 0.08);
    const deliveryFee = order_type === 'delivery' ? parseFloat(settings.delivery_fee || 4.99) : 0;
    const minimumOrder = parseFloat(settings.minimum_order || 15);
    const prepTime = parseInt(settings.estimated_prep_time_minutes || 25);

    // Calculate order totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      // Get menu item details
      const menuItemResult = await client.query(`
        SELECT mi.id, mi.name, mi.base_price, mi.is_available,
          iv.id as variant_id, iv.name as variant_name, iv.price_modifier
        FROM menu_items mi
        LEFT JOIN item_variants iv ON iv.id = $2 AND iv.item_id = mi.id
        WHERE mi.id = $1
      `, [item.item_id, item.variant_id]);

      if (menuItemResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: `Item not found: ${item.item_id}` });
      }

      const menuItem = menuItemResult.rows[0];

      if (!menuItem.is_available) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: `Item not available: ${menuItem.name}` });
      }

      // Calculate item price
      let unitPrice = parseFloat(menuItem.base_price) + parseFloat(menuItem.price_modifier || 0);

      // Process toppings
      const itemToppings = [];
      if (item.toppings && item.toppings.length > 0) {
        for (const topping of item.toppings) {
          const toppingResult = await client.query(
            'SELECT id, name, price FROM toppings WHERE id = $1 AND is_available = true',
            [topping.id]
          );

          if (toppingResult.rows.length > 0) {
            const toppingData = toppingResult.rows[0];
            const toppingQuantity = topping.quantity || 1;
            const toppingPrice = parseFloat(toppingData.price) * toppingQuantity;

            if (topping.modifier_type !== 'remove') {
              unitPrice += toppingPrice;
            }

            itemToppings.push({
              topping_id: toppingData.id,
              topping_name: toppingData.name,
              quantity: toppingQuantity,
              price: toppingPrice,
              modifier_type: topping.modifier_type || 'add'
            });
          }
        }
      }

      const quantity = item.quantity || 1;
      const totalPrice = unitPrice * quantity;
      subtotal += totalPrice;

      orderItems.push({
        menu_item_id: menuItem.id,
        variant_id: menuItem.variant_id,
        item_name: menuItem.name,
        variant_name: menuItem.variant_name,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        special_instructions: item.special_instructions,
        toppings: itemToppings
      });
    }

    // Check minimum order
    if (subtotal < minimumOrder) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Minimum order is $${minimumOrder.toFixed(2)}. Current subtotal: $${subtotal.toFixed(2)}`
      });
    }

    // Apply promo code
    let discountAmount = 0;
    let promoCodeId = null;

    if (promo_code) {
      const promoResult = await client.query(`
        SELECT * FROM promo_codes
        WHERE code = $1
          AND is_active = true
          AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP)
          AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)
          AND (max_uses IS NULL OR uses_count < max_uses)
      `, [promo_code.toUpperCase()]);

      if (promoResult.rows.length > 0) {
        const promo = promoResult.rows[0];

        // Check minimum order for promo
        if (promo.minimum_order && subtotal < parseFloat(promo.minimum_order)) {
          // Promo doesn't apply but order continues
        } else {
          // Check per-customer usage
          if (customerId && promo.max_uses_per_customer) {
            const usageResult = await client.query(
              'SELECT COUNT(*) FROM customer_promo_uses WHERE customer_id = $1 AND promo_code_id = $2',
              [customerId, promo.id]
            );
            if (parseInt(usageResult.rows[0].count) >= promo.max_uses_per_customer) {
              // Customer exceeded usage limit
            } else {
              promoCodeId = promo.id;
            }
          } else {
            promoCodeId = promo.id;
          }

          if (promoCodeId) {
            if (promo.discount_type === 'percentage') {
              discountAmount = subtotal * (parseFloat(promo.discount_value) / 100);
              if (promo.max_discount) {
                discountAmount = Math.min(discountAmount, parseFloat(promo.max_discount));
              }
            } else if (promo.discount_type === 'fixed') {
              discountAmount = parseFloat(promo.discount_value);
            }
          }
        }
      }
    }

    // Calculate final totals
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * taxRate;
    const tipAmountNum = parseFloat(tip_amount || 0);
    const totalAmount = taxableAmount + taxAmount + deliveryFee + tipAmountNum;

    // Calculate estimated times
    const now = new Date();
    const estimatedReadyAt = new Date(now.getTime() + prepTime * 60000);
    const estimatedDeliveryAt = order_type === 'delivery'
      ? new Date(estimatedReadyAt.getTime() + 20 * 60000) // +20 min for delivery
      : null;

    // Create the order
    const orderResult = await client.query(`
      INSERT INTO orders (
        customer_id, status, order_type,
        is_scheduled, scheduled_for,
        estimated_ready_at, estimated_delivery_at,
        delivery_address_id, delivery_address_snapshot, delivery_fee,
        subtotal, tax_amount, tip_amount, discount_amount, total_amount,
        payment_status, payment_method,
        promo_code_id, promo_code_used,
        special_instructions, source
      ) VALUES (
        $1, 'pending', $2,
        $3, $4,
        $5, $6,
        $7, $8, $9,
        $10, $11, $12, $13, $14,
        'pending', $15,
        $16, $17,
        $18, 'web'
      )
      RETURNING *
    `, [
      customerId, order_type,
      !!scheduled_for, scheduled_for,
      estimatedReadyAt, estimatedDeliveryAt,
      deliveryAddressId, JSON.stringify(deliveryAddressSnapshot), deliveryFee,
      subtotal, taxAmount, tipAmountNum, discountAmount, totalAmount,
      payment_method || 'card',
      promoCodeId, promo_code?.toUpperCase(),
      special_instructions
    ]);

    const order = orderResult.rows[0];

    // Insert order items and toppings
    for (const item of orderItems) {
      const orderItemResult = await client.query(`
        INSERT INTO order_items (
          order_id, menu_item_id, variant_id,
          item_name, variant_name,
          quantity, unit_price, total_price, special_instructions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        order.id, item.menu_item_id, item.variant_id,
        item.item_name, item.variant_name,
        item.quantity, item.unit_price, item.total_price, item.special_instructions
      ]);

      const orderItemId = orderItemResult.rows[0].id;

      // Insert toppings
      for (const topping of item.toppings) {
        await client.query(`
          INSERT INTO order_item_toppings (order_item_id, topping_id, topping_name, quantity, price, modifier_type)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [orderItemId, topping.topping_id, topping.topping_name, topping.quantity, topping.price, topping.modifier_type]);
      }

      // Update item order count
      await client.query(
        'UPDATE menu_items SET times_ordered = times_ordered + $1 WHERE id = $2',
        [item.quantity, item.menu_item_id]
      );
    }

    // Update promo code usage
    if (promoCodeId) {
      await client.query(
        'UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id = $1',
        [promoCodeId]
      );

      if (customerId) {
        await client.query(`
          INSERT INTO customer_promo_uses (customer_id, promo_code_id, order_id)
          VALUES ($1, $2, $3)
        `, [customerId, promoCodeId, order.id]);
      }
    }

    await client.query('COMMIT');

    // Create Stripe payment intent if card payment
    let clientSecret = null;
    if (payment_method === 'card') {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Stripe uses cents
        currency: 'usd',
        metadata: {
          order_id: order.id,
          order_number: order.order_number
        },
        receipt_email: customerEmail
      });

      // Update order with payment intent
      await db.query(
        'UPDATE orders SET stripe_payment_intent_id = $1 WHERE id = $2',
        [paymentIntent.id, order.id]
      );

      clientSecret = paymentIntent.client_secret;
    }

    res.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total_amount: totalAmount,
        estimated_ready_at: estimatedReadyAt,
        estimated_delivery_at: estimatedDeliveryAt
      },
      payment: {
        client_secret: clientSecret,
        requires_payment: payment_method === 'card'
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/orders/:id/confirm-payment
 * Confirm payment was successful
 */
router.post('/:id/confirm-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_intent_id } = req.body;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ success: false, error: 'Payment not completed' });
    }

    // Update order
    const result = await db.query(`
      UPDATE orders
      SET payment_status = 'paid', status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND stripe_payment_intent_id = $2
      RETURNING *
    `, [id, payment_intent_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // TODO: Send confirmation email
    // TODO: Notify kitchen (websocket/push)

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ success: false, error: 'Failed to confirm payment' });
  }
});

/**
 * GET /api/orders/:id
 * Get order details
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const orderResult = await db.query(`
      SELECT o.*,
        c.first_name, c.last_name, c.email, c.phone
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE o.id = $1 OR o.order_number = $1
    `, [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Verify ownership if user is logged in
    if (req.user && order.customer_id) {
      const customerCheck = await db.query(
        'SELECT id FROM customers WHERE id = $1 AND user_id = $2',
        [order.customer_id, req.user.id]
      );
      // Allow if customer matches or user is staff
      // For now, allow access (could add staff check)
    }

    // Get order items
    const itemsResult = await db.query(`
      SELECT oi.*,
        COALESCE(json_agg(
          json_build_object(
            'name', oit.topping_name,
            'quantity', oit.quantity,
            'price', oit.price,
            'modifier', oit.modifier_type
          )
        ) FILTER (WHERE oit.id IS NOT NULL), '[]') AS toppings
      FROM order_items oi
      LEFT JOIN order_item_toppings oit ON oit.order_item_id = oi.id
      WHERE oi.order_id = $1
      GROUP BY oi.id
      ORDER BY oi.created_at
    `, [order.id]);

    // Get status history
    const historyResult = await db.query(`
      SELECT status, created_at, notes
      FROM order_status_history
      WHERE order_id = $1
      ORDER BY created_at ASC
    `, [order.id]);

    res.json({
      success: true,
      order: {
        ...order,
        items: itemsResult.rows,
        status_history: historyResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

/**
 * GET /api/orders
 * Get customer's orders
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    // Get customer
    const customerResult = await db.query(
      'SELECT id FROM customers WHERE user_id = $1',
      [req.user.id]
    );

    if (customerResult.rows.length === 0) {
      return res.json({ success: true, orders: [], total: 0 });
    }

    const customerId = customerResult.rows[0].id;

    let query = `
      SELECT o.id, o.order_number, o.status, o.order_type,
        o.total_amount, o.created_at, o.estimated_ready_at, o.estimated_delivery_at
      FROM orders o
      WHERE o.customer_id = $1
    `;
    const params = [customerId];

    if (status) {
      query += ` AND o.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const ordersResult = await db.query(query, params);

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM orders WHERE customer_id = $1 ${status ? 'AND status = $2' : ''}`,
      status ? [customerId, status] : [customerId]
    );

    res.json({
      success: true,
      orders: ordersResult.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// ============================================
// KITCHEN / STAFF ENDPOINTS
// ============================================

/**
 * GET /api/orders/kitchen/queue
 * Get orders for kitchen display
 */
router.get('/kitchen/queue', requireAuth, requireStaff('cook'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.id, o.order_number, o.status, o.order_type,
        o.created_at, o.estimated_ready_at, o.special_instructions,
        c.first_name, c.phone,
        json_agg(
          json_build_object(
            'id', oi.id,
            'name', oi.item_name,
            'variant', oi.variant_name,
            'quantity', oi.quantity,
            'instructions', oi.special_instructions,
            'toppings', (
              SELECT COALESCE(json_agg(
                json_build_object('name', oit.topping_name, 'modifier', oit.modifier_type)
              ), '[]')
              FROM order_item_toppings oit WHERE oit.order_item_id = oi.id
            )
          )
        ) AS items
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status IN ('confirmed', 'preparing')
      GROUP BY o.id, c.first_name, c.phone
      ORDER BY o.created_at ASC
    `);

    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error('Error fetching kitchen queue:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch queue' });
  }
});

/**
 * PUT /api/orders/:id/status
 * Update order status (staff only)
 */
router.put('/:id/status', requireAuth, requireStaff('cook'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'picked_up', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const result = await db.query(`
      UPDATE orders
      SET status = $1
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Add note to history if provided
    if (notes) {
      await db.query(`
        UPDATE order_status_history
        SET notes = $1
        WHERE order_id = $2 AND status = $3
        ORDER BY created_at DESC
        LIMIT 1
      `, [notes, id, status]);
    }

    // TODO: Send notification to customer

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

/**
 * POST /api/orders/:id/cancel
 * Cancel an order
 */
router.post('/:id/cancel', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Get order
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Check if cancellable
    const nonCancellable = ['out_for_delivery', 'delivered', 'picked_up', 'cancelled'];
    if (nonCancellable.includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be cancelled at this stage'
      });
    }

    // Refund if paid
    if (order.payment_status === 'paid' && order.stripe_payment_intent_id) {
      await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent_id
      });
    }

    // Update order
    const result = await db.query(`
      UPDATE orders
      SET status = 'cancelled',
        payment_status = CASE WHEN payment_status = 'paid' THEN 'refunded' ELSE payment_status END,
        cancellation_reason = $1
      WHERE id = $2
      RETURNING *
    `, [reason, id]);

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel order' });
  }
});

module.exports = router;
