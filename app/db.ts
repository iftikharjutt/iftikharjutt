import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('iftikhar_brothers.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, person_name TEXT, contact TEXT, address TEXT, balance REAL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, category TEXT, base_price REAL);
    CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER, total_amount REAL, cash_paid REAL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, product_name TEXT, unit TEXT, quantity REAL, rate REAL, subtotal REAL);
    CREATE TABLE IF NOT EXISTS recoveries (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER, amount REAL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS error_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, stack TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);
  `);

  // Migration for existing databases
  try {
    db.execSync("ALTER TABLE customers ADD COLUMN person_name TEXT;");
  } catch (e) {
    // Column might already exist
  }

  // Initial Seed
  const settingsCount = db.getAllSync('SELECT COUNT(*) as count FROM settings')[0] as any;
  if (settingsCount.count === 0) {
    db.runSync("INSERT INTO settings (key, value) VALUES ('shop_whatsapp', '03001234567')");
    db.runSync("INSERT INTO settings (key, value) VALUES ('shop_name', 'Iftikhar Brothers')");
    db.runSync("INSERT INTO settings (key, value) VALUES ('app_pin', '1234')");
  }
  const count = db.getAllSync('SELECT COUNT(*) as count FROM products')[0] as any;
  if (count.count === 0) {
    const products = [['Basmati Rice', 'Rice', 350], ['Sugar', 'Sugar', 150], ['Vanaspati Ghee', 'Ghee', 520]];
    products.forEach(p => db.runSync('INSERT INTO products (name, category, base_price) VALUES (?, ?, ?)', p));
  }
};

// Ensure database is initialized immediately when module is loaded
try {
  initDatabase();
} catch (e) {
  console.error("Critical: Failed to initialize database", e);
}

export default db;
