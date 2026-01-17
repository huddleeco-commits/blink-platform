/**
 * Seed Data for Pizza Ordering SaaS
 * Run: node database/seed.js
 */

require('dotenv').config();
const db = require('./db');

async function seed() {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');
    console.log('🌱 Starting seed...');

    // ============================================
    // STORE SETTINGS
    // ============================================
    console.log('   📋 Creating store settings...');

    const settings = [
      { key: 'tax_rate', value: 0.08 },
      { key: 'delivery_fee', value: 4.99 },
      { key: 'minimum_order', value: 15.00 },
      { key: 'delivery_radius_miles', value: 5 },
      { key: 'estimated_prep_time_minutes', value: 25 },
      { key: 'accepts_cash', value: true },
      { key: 'accepts_card', value: true },
      {
        key: 'store_hours',
        value: {
          monday: { open: '11:00', close: '22:00' },
          tuesday: { open: '11:00', close: '22:00' },
          wednesday: { open: '11:00', close: '22:00' },
          thursday: { open: '11:00', close: '22:00' },
          friday: { open: '11:00', close: '23:00' },
          saturday: { open: '11:00', close: '23:00' },
          sunday: { open: '12:00', close: '21:00' }
        }
      }
    ];

    for (const { key, value } of settings) {
      await client.query(`
        INSERT INTO store_settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = $2
      `, [key, JSON.stringify(value)]);
    }

    // ============================================
    // MENU CATEGORIES
    // ============================================
    console.log('   📁 Creating menu categories...');

    const categories = [
      { name: 'Specialty Pizzas', description: 'Our signature creations', order: 1 },
      { name: 'Build Your Own', description: 'Start with a base and customize', order: 2 },
      { name: 'Calzones', description: 'Folded and stuffed with goodness', order: 3 },
      { name: 'Appetizers', description: 'Start your meal right', order: 4 },
      { name: 'Salads', description: 'Fresh and healthy options', order: 5 },
      { name: 'Drinks', description: 'Beverages to complement your meal', order: 6 },
      { name: 'Desserts', description: 'Sweet endings', order: 7 }
    ];

    const categoryIds = {};
    for (const cat of categories) {
      const result = await client.query(`
        INSERT INTO menu_categories (name, description, display_order)
        VALUES ($1, $2, $3)
        RETURNING id, name
      `, [cat.name, cat.description, cat.order]);
      categoryIds[cat.name] = result.rows[0].id;
    }

    // ============================================
    // TOPPINGS
    // ============================================
    console.log('   🍄 Creating toppings...');

    const toppings = [
      // Meats
      { name: 'Pepperoni', category: 'meat', price: 2.00, premium: false },
      { name: 'Italian Sausage', category: 'meat', price: 2.50, premium: false },
      { name: 'Bacon', category: 'meat', price: 2.50, premium: false },
      { name: 'Ham', category: 'meat', price: 2.00, premium: false },
      { name: 'Grilled Chicken', category: 'meat', price: 3.00, premium: true },
      { name: 'Meatballs', category: 'meat', price: 3.00, premium: false },
      { name: 'Prosciutto', category: 'meat', price: 4.00, premium: true },

      // Vegetables
      { name: 'Mushrooms', category: 'vegetable', price: 1.50, veg: true },
      { name: 'Bell Peppers', category: 'vegetable', price: 1.50, veg: true },
      { name: 'Red Onion', category: 'vegetable', price: 1.00, veg: true },
      { name: 'Black Olives', category: 'vegetable', price: 1.50, veg: true },
      { name: 'Jalapeños', category: 'vegetable', price: 1.50, veg: true },
      { name: 'Spinach', category: 'vegetable', price: 1.50, veg: true },
      { name: 'Tomatoes', category: 'vegetable', price: 1.50, veg: true },
      { name: 'Artichoke Hearts', category: 'vegetable', price: 2.50, veg: true, premium: true },
      { name: 'Roasted Garlic', category: 'vegetable', price: 1.50, veg: true },
      { name: 'Banana Peppers', category: 'vegetable', price: 1.50, veg: true },
      { name: 'Pineapple', category: 'vegetable', price: 1.50, veg: true },

      // Cheeses
      { name: 'Extra Mozzarella', category: 'cheese', price: 2.00, veg: true },
      { name: 'Feta Cheese', category: 'cheese', price: 2.50, veg: true },
      { name: 'Goat Cheese', category: 'cheese', price: 3.00, veg: true, premium: true },
      { name: 'Ricotta', category: 'cheese', price: 2.50, veg: true },
      { name: 'Parmesan', category: 'cheese', price: 2.00, veg: true },
      { name: 'Blue Cheese', category: 'cheese', price: 3.00, veg: true, premium: true },

      // Sauces
      { name: 'Marinara Sauce', category: 'sauce', price: 0, veg: true },
      { name: 'White Garlic Sauce', category: 'sauce', price: 0, veg: true },
      { name: 'BBQ Sauce', category: 'sauce', price: 0, veg: true },
      { name: 'Buffalo Sauce', category: 'sauce', price: 0, veg: true },
      { name: 'Pesto', category: 'sauce', price: 1.50, veg: true, premium: true },
      { name: 'Olive Oil Base', category: 'sauce', price: 0, veg: true },

      // Crusts
      { name: 'Thin Crust', category: 'crust', price: 0, veg: true },
      { name: 'Traditional Hand-Tossed', category: 'crust', price: 0, veg: true },
      { name: 'Deep Dish', category: 'crust', price: 2.00, veg: true },
      { name: 'Gluten-Free Crust', category: 'crust', price: 3.00, veg: true, gf: true }
    ];

    for (let i = 0; i < toppings.length; i++) {
      const t = toppings[i];
      await client.query(`
        INSERT INTO toppings (name, category, price, is_premium, is_vegetarian, is_vegan, display_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [t.name, t.category, t.price, t.premium || false, t.veg || false, t.vegan || false, i]);
    }

    // ============================================
    // MENU ITEMS
    // ============================================
    console.log('   🍕 Creating menu items...');

    const pizzas = [
      {
        name: 'Margherita',
        description: 'Fresh mozzarella, San Marzano tomatoes, basil, extra virgin olive oil',
        price: 16.99,
        featured: true,
        vegetarian: true,
        category: 'Specialty Pizzas'
      },
      {
        name: 'Meat Lovers Supreme',
        description: 'Pepperoni, Italian sausage, bacon, ham, and meatballs on marinara',
        price: 21.99,
        featured: true,
        popular: true,
        category: 'Specialty Pizzas'
      },
      {
        name: 'BBQ Chicken',
        description: 'Grilled chicken, red onion, cilantro, smoked gouda on tangy BBQ sauce',
        price: 19.99,
        popular: true,
        category: 'Specialty Pizzas'
      },
      {
        name: 'Veggie Garden',
        description: 'Mushrooms, bell peppers, onions, olives, tomatoes, spinach on marinara',
        price: 17.99,
        vegetarian: true,
        category: 'Specialty Pizzas'
      },
      {
        name: 'Hawaiian',
        description: 'Ham, pineapple, bacon on marinara with extra mozzarella',
        price: 18.99,
        category: 'Specialty Pizzas'
      },
      {
        name: 'Buffalo Chicken',
        description: 'Spicy buffalo chicken, blue cheese crumbles, celery, ranch drizzle',
        price: 19.99,
        category: 'Specialty Pizzas'
      },
      {
        name: 'White Pizza',
        description: 'Ricotta, mozzarella, parmesan, garlic on olive oil base',
        price: 17.99,
        vegetarian: true,
        category: 'Specialty Pizzas'
      },
      {
        name: 'Pepperoni Classic',
        description: 'Generous pepperoni, mozzarella, marinara - the timeless favorite',
        price: 15.99,
        popular: true,
        category: 'Specialty Pizzas'
      },
      {
        name: 'Build Your Own Pizza',
        description: 'Choose your crust, sauce, cheese, and toppings',
        price: 12.99,
        category: 'Build Your Own',
        customizable: true
      }
    ];

    const variants = [
      { name: 'Small (10")', modifier: 0, serves: '1-2 people', default: false },
      { name: 'Medium (12")', modifier: 3, serves: '2-3 people', default: true },
      { name: 'Large (14")', modifier: 6, serves: '3-4 people', default: false },
      { name: 'X-Large (16")', modifier: 9, serves: '4-5 people', default: false }
    ];

    for (const pizza of pizzas) {
      const itemResult = await client.query(`
        INSERT INTO menu_items (
          category_id, name, description, base_price,
          is_featured, is_popular, is_vegetarian, allows_customization
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        categoryIds[pizza.category],
        pizza.name,
        pizza.description,
        pizza.price,
        pizza.featured || false,
        pizza.popular || false,
        pizza.vegetarian || false,
        pizza.customizable !== false
      ]);

      const itemId = itemResult.rows[0].id;

      // Add size variants for pizzas
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        await client.query(`
          INSERT INTO item_variants (item_id, name, price_modifier, serves, is_default, display_order)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [itemId, v.name, v.modifier, v.serves, v.default, i]);
      }
    }

    // Add calzones
    const calzones = [
      { name: 'Classic Calzone', description: 'Ricotta, mozzarella, and your choice of 3 toppings', price: 14.99 },
      { name: 'Meat Calzone', description: 'Pepperoni, sausage, ham, ricotta, mozzarella', price: 16.99 },
      { name: 'Veggie Calzone', description: 'Spinach, mushrooms, peppers, onions, ricotta', price: 15.99, vegetarian: true }
    ];

    for (const item of calzones) {
      await client.query(`
        INSERT INTO menu_items (category_id, name, description, base_price, is_vegetarian)
        VALUES ($1, $2, $3, $4, $5)
      `, [categoryIds['Calzones'], item.name, item.description, item.price, item.vegetarian || false]);
    }

    // Add appetizers
    const appetizers = [
      { name: 'Garlic Knots (6)', description: 'Fresh-baked knots brushed with garlic butter', price: 6.99, vegetarian: true },
      { name: 'Mozzarella Sticks (6)', description: 'Crispy breaded mozzarella with marinara', price: 8.99, vegetarian: true },
      { name: 'Buffalo Wings (10)', description: 'Crispy wings tossed in buffalo sauce with ranch', price: 12.99 },
      { name: 'Breadsticks (8)', description: 'Warm breadsticks with marinara dipping sauce', price: 7.99, vegetarian: true },
      { name: 'Loaded Garlic Bread', description: 'Garlic bread topped with mozzarella and herbs', price: 8.99, vegetarian: true }
    ];

    for (const item of appetizers) {
      await client.query(`
        INSERT INTO menu_items (category_id, name, description, base_price, is_vegetarian, allows_customization)
        VALUES ($1, $2, $3, $4, $5, false)
      `, [categoryIds['Appetizers'], item.name, item.description, item.price, item.vegetarian || false]);
    }

    // Add salads
    const salads = [
      { name: 'Caesar Salad', description: 'Romaine, parmesan, croutons, creamy Caesar dressing', price: 10.99, vegetarian: true },
      { name: 'Garden Salad', description: 'Mixed greens, tomatoes, cucumbers, red onion, choice of dressing', price: 9.99, vegetarian: true },
      { name: 'Greek Salad', description: 'Romaine, feta, olives, tomatoes, cucumbers, red onion', price: 11.99, vegetarian: true },
      { name: 'Antipasto Salad', description: 'Mixed greens, salami, pepperoni, olives, peppers, mozzarella', price: 13.99 }
    ];

    for (const item of salads) {
      await client.query(`
        INSERT INTO menu_items (category_id, name, description, base_price, is_vegetarian, allows_customization)
        VALUES ($1, $2, $3, $4, $5, false)
      `, [categoryIds['Salads'], item.name, item.description, item.price, item.vegetarian || false]);
    }

    // Add drinks
    const drinks = [
      { name: 'Fountain Drink', description: 'Coke, Diet Coke, Sprite, or Lemonade', price: 2.99 },
      { name: '2-Liter Soda', description: 'Coke, Diet Coke, Sprite, or Fanta', price: 4.99 },
      { name: 'Bottled Water', description: 'Poland Spring 16oz', price: 1.99 },
      { name: 'Iced Tea', description: 'Fresh-brewed unsweetened or sweet tea', price: 2.99 }
    ];

    for (const item of drinks) {
      await client.query(`
        INSERT INTO menu_items (category_id, name, description, base_price, is_vegetarian, allows_customization)
        VALUES ($1, $2, $3, $4, true, false)
      `, [categoryIds['Drinks'], item.name, item.description, item.price]);
    }

    // Add desserts
    const desserts = [
      { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center, vanilla ice cream', price: 7.99 },
      { name: 'Cannoli (2)', description: 'Crispy shells filled with sweet ricotta cream', price: 6.99 },
      { name: 'Tiramisu', description: 'Classic Italian dessert with espresso-soaked ladyfingers', price: 7.99 },
      { name: 'Zeppoles (6)', description: 'Fried dough dusted with powdered sugar', price: 5.99 }
    ];

    for (const item of desserts) {
      await client.query(`
        INSERT INTO menu_items (category_id, name, description, base_price, is_vegetarian, allows_customization)
        VALUES ($1, $2, $3, $4, true, false)
      `, [categoryIds['Desserts'], item.name, item.description, item.price]);
    }

    // ============================================
    // PROMO CODES
    // ============================================
    console.log('   🎫 Creating promo codes...');

    const promoCodes = [
      { code: 'WELCOME10', type: 'percentage', value: 10, min: 20, firstOnly: true, desc: 'First order discount' },
      { code: 'PIZZA20', type: 'percentage', value: 20, min: 30, max_discount: 15, desc: 'Limited time offer' },
      { code: 'FREEDELIVERY', type: 'fixed', value: 4.99, min: 25, desc: 'Free delivery on orders $25+' }
    ];

    for (const promo of promoCodes) {
      await client.query(`
        INSERT INTO promo_codes (code, description, discount_type, discount_value, minimum_order, max_discount, first_order_only, valid_until)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE + INTERVAL '90 days')
      `, [promo.code, promo.desc, promo.type, promo.value, promo.min, promo.max_discount || null, promo.firstOnly || false]);
    }

    await client.query('COMMIT');
    console.log('✅ Seed completed successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
