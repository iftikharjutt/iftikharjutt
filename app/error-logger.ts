import db from './db';

export const logError = (error: Error | string, context?: string) => {
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? context || 'No stack trace' : error.stack || 'No stack trace';
  
  try {
    db.runSync(
      'INSERT INTO error_logs (message, stack) VALUES (?, ?)',
      [`[${context || 'General'}] ${message}`, stack]
    );
    console.error(`Logged Error: ${message}`);
  } catch (e) {
    console.error("Critical: Failed to log error to DB", e);
  }
};

export const getErrorLogs = () => {
  try {
    return db.getAllSync('SELECT * FROM error_logs ORDER BY timestamp DESC LIMIT 50');
  } catch (e) {
    return [];
  }
};

export const clearErrorLogs = () => {
  try {
    db.runSync('DELETE FROM error_logs');
  } catch (e) {}
};
