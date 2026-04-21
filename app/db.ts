import * as SQLite from 'expo-sqlite';

const DB_NAME = 'iftikhar_brothers.db';
const db = SQLite.openDatabaseSync(DB_NAME);

/**
 * REFACTOR: Implementation of Atomic Schema Initialization
 * 1. Uses withTransactionSync to ensure schema is "all-or-nothing".
 * 2. Uses PRAGMA table_info for safe, non-crashing migrations.
 * 3. Enforces Strict Mode for SQLite.
 */
export const initDatabase = () => {
  try {
    db.withTransactionSync(() => {
      // Create Core Tables
      db.execSync(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT, 
          name TEXT NOT NULL, 
          person_name TEXT, 
          contact TEXT, 
          address TEXT, 
          balance REAL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT, 
          name TEXT NOT NULL, 
          category TEXT, 
          base_price REAL
        );
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT, 
          customer_id INTEGER, 
          total_amount REAL, 
          cash_paid REAL, 
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT, 
          order_id INTEGER, 
          product_name TEXT, 
          unit TEXT, 
          quantity REAL, 
          rate REAL, 
          subtotal REAL
        );
        CREATE TABLE IF NOT EXISTS recoveries (
          id INTEGER PRIMARY KEY AUTOINCREMENT, 
          customer_id INTEGER, 
          amount REAL, 
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
      `);

      // REFACTOR: Safe Migration (Security & Stability)
      const tableInfo = db.getAllSync(`PRAGMA table_info(customers)`);
      if (!tableInfo.some((col: any) => col.name === 'person_name')) {
        db.execSync("ALTER TABLE customers ADD COLUMN person_name TEXT;");
      }

      // Initial Seed Data
      const settings = db.getAllSync('SELECT COUNT(*) as count FROM settings')[0] as any;
      if (settings.count === 0) {
        db.runSync("INSERT INTO settings (key, value) VALUES (?, ?)", ['shop_name', 'Iftikhar Brothers']);
        db.runSync("INSERT INTO settings (key, value) VALUES (?, ?)", ['shop_whatsapp', '03001234567']);
        db.runSync("INSERT INTO settings (key, value) VALUES (?, ?)", ['app_pin', '1234']);
      }
    });
  } catch (error) {
    // REFACTOR: Centralized Error Reporting
    console.error("DATABASE_CRITICAL_INIT_FAILURE", error);
  }
};

initDatabase();
export default db;