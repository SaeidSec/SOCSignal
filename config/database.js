// Switch between SQLite and MySQL based on DATABASE_TYPE environment variable
// Set DATABASE_TYPE=sqlite for SQLite, DATABASE_TYPE=mysql for MySQL, default to SQLite
const { db, initDatabase } = (process.env.DATABASE_TYPE === 'mysql')
  ? require('./database.mysql') 
  : require('./database.sqlite');

module.exports = { db, initDatabase };
