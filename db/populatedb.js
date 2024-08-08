require("dotenv").config();

const { Pool } = require("pg");
const queries = require("./queries");

// Create a new PostgreSQL pool connection
const pool = new Pool({
  // Your PostgreSQL connection details
  host: process.env.HOST, // or wherever the db is hosted
  user: process.env.USER,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT, // The default port
});

async function populateDatabase() {
  try {
    // Create some sample categories
    const category1Id = await queries.createCategory(
      "Chocolate",
      "Delicious chocolate candies"
    );
    const category2Id = await queries.createCategory(
      "Gummies",
      "Chewy and fruity gummy candies"
    );
    const category3Id = await queries.createCategory(
      "Hard Candies",
      "Classic hard candies"
    );

    // Create some sample items
    await queries.createItem(
      "Milk Chocolate Bar",
      "A classic milk chocolate bar",
      2.99,
      50,
      [category1Id]
    );
    await queries.createItem(
      "Dark Chocolate Truffles",
      "Rich and decadent chocolate truffles",
      4.99,
      25,
      [category1Id]
    );
    await queries.createItem(
      "Sour Gummy Worms",
      "Tangy and chewy gummy worms",
      1.99,
      75,
      [category2Id]
    );
    await queries.createItem(
      "Cherry Lollipops",
      "Hard candy lollipops in cherry flavor",
      0.99,
      100,
      [category3Id]
    );

    console.log("Database populated with sample data!");
  } catch (error) {
    console.error("Error populating database:", error);
  } finally {
    pool.end(); // Close the PostgreSQL connection pool
  }
}

populateDatabase();
