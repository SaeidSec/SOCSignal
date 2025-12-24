// Automatically switch between SQLite (Local) and MySQL (Production)
const { db, initDatabase } = process.env.DB_HOST 
  ? require('./database.mysql') 
  : require('./database.sqlite');

module.exports = { db, initDatabase };
