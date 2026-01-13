// Switch between SQLite and MySQL based on DATABASE_TYPE environment variable
// Set DATABASE_TYPE=sqlite for SQLite, DATABASE_TYPE=mysql for MySQL, default to SQLite
// Explicitly check for 'mysql' value, otherwise default to SQLite
const databaseType = process.env.DATABASE_TYPE ? process.env.DATABASE_TYPE.toLowerCase() : 'sqlite';
const { db, initDatabase } = (databaseType === 'mysql')
  ? require('./database.mysql') 
  : require('./database.sqlite');

module.exports = { db, initDatabase };
