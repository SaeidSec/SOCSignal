const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// Create MySQL connection pool
const dbConfig = process.env.DATABASE_URL 
  ? {
      uri: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'blog_db',
      ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : null
    };

if (process.env.DATABASE_URL) {
  console.log('Connecting to database using connection string...');
} else {
  console.log(`Connecting to database at ${dbConfig.host}:${dbConfig.port}...`);
}

const pool = dbConfig.uri 
  ? mysql.createPool(dbConfig.uri + (dbConfig.uri.includes('?') ? '&' : '?') + 'ssl={"rejectUnauthorized":false}')
  : mysql.createPool({ ...dbConfig, waitForConnections: true, connectionLimit: 10, queueLimit: 0 });

// Get a promise-based connection from the pool
const db = pool.promise();

// Initialize database tables
const initDatabase = async () => {
  try {
    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create posts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        cover_image VARCHAR(500),
        meta_description VARCHAR(500),
        meta_keywords VARCHAR(500),
        tags VARCHAR(500),
        author VARCHAR(255) DEFAULT 'Admin',
        reading_time INT DEFAULT 5,
        category VARCHAR(255) DEFAULT 'Uncategorized',
        published TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create default admin user if not exists
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM users WHERE username = ?', ['saeidnimi']);
    if (rows[0].count === 0) {
      const hash = await bcrypt.hash("={de7R*YJ'<21#jeu*a6", 10);
      await db.execute(
        'INSERT INTO users (username, password_hash) VALUES (?, ?)',
        ['saeidnimi', hash]
      );
      
      // Create sample post
      const [postRows] = await db.execute('SELECT COUNT(*) as count FROM posts');
      if (postRows[0].count === 0) {
        await db.execute(`
          INSERT INTO posts (title, slug, content, excerpt, published, author, category, reading_time)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          'Welcome to Your New Blog',
          'welcome-to-your-new-blog',
          '# Welcome to Your New Blog\n\nThis is a sample post to get you started. You can edit or delete this post from the admin panel.\n\n## Getting Started\n\n1. Log in to the admin panel using the default credentials:\n   - Username: admin\n   - Password: admin123\n2. Create your first post\n3. Customize the site design\n\nEnjoy your new blog!',
          'This is a sample post to get you started with your new blog.',
          1,
          'Admin',
          'Getting Started',
          2
        ]);
      }
    }
    
    console.log('MySQL database initialized successfully');
  } catch (error) {
    console.error('Error initializing MySQL database:', error);
    throw error;
  }
};

module.exports = { db, initDatabase };