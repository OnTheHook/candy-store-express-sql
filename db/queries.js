// queries.js
const pool = require("./pool");

// Utility functions
exports.getCategoryUrl = (id) => `/catalog/category/${id}`;
exports.getItemUrl = (id) => `/catalog/item/${id}`;

// Category Queries
exports.getAllCategories = async () => {
  const res = await pool.query("SELECT * FROM categories ORDER BY name ASC");
  return res.rows;
};

exports.getCategoryById = async (id) => {
  const res = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
  return res.rows[0];
};

exports.getCategoryByName = async (name) => {
  const res = await pool.query("SELECT * FROM categories WHERE name = $1", [
    name,
  ]);
  return res.rows[0];
};

exports.createCategory = async (name, description) => {
  const res = await pool.query(
    "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id",
    [name, description]
  );
  return res.rows[0].id;
};

exports.updateCategory = async (id, name, description) => {
  await pool.query(
    "UPDATE categories SET name = $1, description = $2 WHERE id = $3",
    [name, description, id]
  );
};

exports.deleteCategory = async (id) => {
  await pool.query("DELETE FROM categories WHERE id = $1", [id]);
};

exports.getItemsInCategory = async (categoryId) => {
  const res = await pool.query(
    "SELECT i.id, i.name, i.description FROM items i JOIN item_categories ic ON i.id = ic.item_id WHERE ic.category_id = $1",
    [categoryId]
  );
  return res.rows;
};

// Item Queries
exports.getAllItems = async () => {
  const res = await pool.query(`
    SELECT i.id, i.name, array_agg(c.name) as categories
    FROM items i
    LEFT JOIN item_categories ic ON i.id = ic.item_id
    LEFT JOIN categories c ON ic.category_id = c.id
    GROUP BY i.id, i.name
    ORDER BY i.name ASC
  `);
  return res.rows;
};

exports.getItemById = async (id) => {
  const itemRes = await pool.query("SELECT * FROM items WHERE id = $1", [id]);
  const item = itemRes.rows[0];
  if (!item) return null;

  const categoryRes = await pool.query(
    "SELECT c.id, c.name FROM categories c JOIN item_categories ic ON c.id = ic.category_id WHERE ic.item_id = $1",
    [id]
  );
  item.categories = categoryRes.rows;
  return item;
};

exports.createItem = async (name, description, price, amount, categoryIds) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const itemRes = await client.query(
      "INSERT INTO items (name, description, price, amount) VALUES ($1, $2, $3, $4) RETURNING id",
      [name, description, price, amount]
    );
    const itemId = itemRes.rows[0].id;
    for (const categoryId of categoryIds) {
      await client.query(
        "INSERT INTO item_categories (item_id, category_id) VALUES ($1, $2)",
        [itemId, categoryId]
      );
    }
    await client.query("COMMIT");
    return itemId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.updateItem = async (
  id,
  name,
  description,
  price,
  amount,
  categoryIds
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE items SET name = $1, description = $2, price = $3, amount = $4 WHERE id = $5",
      [name, description, price, amount, id]
    );
    await client.query("DELETE FROM item_categories WHERE item_id = $1", [id]);
    for (const categoryId of categoryIds) {
      await client.query(
        "INSERT INTO item_categories (item_id, category_id) VALUES ($1, $2)",
        [id, categoryId]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.deleteItem = async (id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Delete records from item_categories table first
    await client.query("DELETE FROM item_categories WHERE item_id = $1", [id]);

    // Then delete the item from the items table
    await client.query("DELETE FROM items WHERE id = $1", [id]);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.getCategoryCount = async () => {
  const res = await pool.query("SELECT COUNT(*) FROM categories");
  return parseInt(res.rows[0].count);
};

exports.getItemCount = async () => {
  const res = await pool.query("SELECT COUNT(*) FROM items");
  return parseInt(res.rows[0].count);
};
