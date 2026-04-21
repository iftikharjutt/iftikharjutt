import * as SQLite from 'expo-sqlite';

const DB_NAME = 'iftikhar_brothers.db';
const db = SQLite.openDatabaseSync(DB_NAME);

/**
 * Ensures all tables and migrations are handled in a single atomic block.
 */
export const initDatabase = () => {
  try {
    db.withTransactionSync(() => {
      // 1. Core Schema
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
        CREATE TABLE IF NOT EXISTS error_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT, 
          message TEXT, 
          stack TEXT, 
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Safe Migration Check
      const tableInfo = db.getAllSync(`PRAGMA table_info(customers)`);
      const hasPersonName = tableInfo.some((col: any) => col.name === 'person_name');
      if (!hasPersonName) {
        db.execSync("ALTER TABLE customers ADD COLUMN person_name TEXT;");
      }

      // 3. Seed Default Settings
      const settingsCount = db.getAllSync('SELECT COUNT(*) as count FROM settings')[0] as any;
      if (settingsCount.count === 0) {
        db.runSync("INSERT INTO settings (key, value) VALUES ('shop_whatsapp', '03001234567')");
        db.runSync("INSERT INTO settings (key, value) VALUES ('shop_name', 'Iftikhar Brothers')");
        db.runSync("INSERT INTO settings (key, value) VALUES ('app_pin', '1234')");
      }
    });
  } catch (e) {
    console.error("DB_INIT_ERROR:", e);
  }
};

// Initialize immediately
initDatabase();

export default db;
