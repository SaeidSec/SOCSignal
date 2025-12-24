const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Create or connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, '..', 'database.db'));

// Add promise-based execute method to mimic mysql2 API
db.execute = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    // Determine if it's a SELECT query
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

    if (isSelect) {
      this.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve([rows, null]);
      });
    } else {
      this.run(sql, params, function (err) {
        if (err) return reject(err);
        // Mimic mysql2 result object
        const result = {
          insertId: this.lastID,
          affectedRows: this.changes
        };
        resolve([result, null]);
      });
    }
  });
};

// Initialize database tables
const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          return reject(err);
        }

        // Create posts table
        db.run(`
          CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            content TEXT NOT NULL,
            excerpt TEXT,
            cover_image TEXT,
            meta_description TEXT,
            meta_keywords TEXT,
            tags TEXT,
            author TEXT DEFAULT 'Admin',
            reading_time INTEGER DEFAULT 5,
            category TEXT DEFAULT 'Uncategorized',
            published INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('Error creating posts table:', err);
            return reject(err);
          }

          // Create default admin user if not exists
          bcrypt.hash('admin123', 10, (err, hash) => {
            if (err) {
              console.error('Error hashing default password:', err);
              return reject(err);
            }

            db.run(`
              INSERT OR IGNORE INTO users (username, password_hash)
              VALUES ('admin', ?)
            `, [hash], (err) => {
              if (err) {
                console.error('Error creating default admin user:', err);
                return reject(err);
              }

              // Create sample post if no posts exist
              db.get('SELECT COUNT(*) as count FROM posts', (err, row) => {
                if (err) {
                  console.error('Error checking posts count:', err);
                  return reject(err);
                }

                if (row.count === 0) {
                  const samplePost = {
                    title: 'Welcome to Your New Blog',
                    slug: 'welcome-to-your-new-blog',
                    content: '# Welcome to Your New Blog\n\nThis is a sample post to get you started. You can edit or delete this post from the admin panel.\n\n## Getting Started\n\n1. Log in to the admin panel using the default credentials:\n   - Username: admin\n   - Password: admin123\n2. Create your first post\n3. Customize the site design\n\nEnjoy your new blog!',
                    excerpt: 'This is a sample post to get you started with your new blog.',
                    published: 1,
                    author: 'Admin',
                    category: 'Getting Started',
                    reading_time: 2
                  };

                  db.run(`
                    INSERT INTO posts (title, slug, content, excerpt, published, author, category, reading_time)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                  `, [
                    samplePost.title,
                    samplePost.slug,
                    samplePost.content,
                    samplePost.excerpt,
                    samplePost.published,
                    samplePost.author,
                    samplePost.category,
                    samplePost.reading_time
                  ], (err) => {
                    if (err) {
                      console.error('Error creating sample post:', err);
                      return reject(err);
                    }

                    console.log('Database initialized successfully with sample data');
                    resolve();
                  });
                } else {
                  console.log('Database initialized successfully');
                  resolve();
                }
              });
            });
          });
        });
      });
    });
  });
};

module.exports = { db, initDatabase };
