const express = require('express');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper function to generate slug from title
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// Helper: Convert SQLite row to Post object
const mapRowToPost = (row) => {
    return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        content: row.content,
        excerpt: row.excerpt,
        cover_image: row.cover_image,
        meta_description: row.meta_description,
        meta_keywords: row.meta_keywords,
        tags: row.tags,
        author: row.author,
        reading_time: row.reading_time,
        category: row.category,
        published: row.published ? 1 : 0,
        created_at: row.created_at,
        updated_at: row.updated_at
    };
};

// GET /api/posts - Get all published posts (with optional category filter)
router.get('/posts', async (req, res) => {
    try {
        const { category } = req.query;
        
        let sql = 'SELECT * FROM posts WHERE published = 1';
        const params = [];
        
        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }
        
        sql += ' ORDER BY created_at DESC';
        
        const [rows] = await db.execute(sql, params);
        const posts = rows.map(mapRowToPost);
        res.json({ posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/categories - Get list of used categories
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT DISTINCT category FROM posts WHERE published = 1 AND category IS NOT NULL');
        const categories = rows.map(row => row.category).sort();
        res.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/posts/:slug - Get single post by slug
router.get('/posts/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const [rows] = await db.execute('SELECT * FROM posts WHERE slug = ? AND published = 1', [slug]);
        const row = rows[0];

        if (!row) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const post = mapRowToPost(row);
        res.json({ post });
    } catch (error) {
        console.error('Error fetching post:', error);
        return res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/admin/posts - Get all posts (including unpublished) - Protected
router.get('/admin/posts', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM posts ORDER BY created_at DESC');
        const posts = rows.map(mapRowToPost);
        res.json({ posts });
    } catch (error) {
        console.error('Error fetching admin posts:', error);
        return res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/posts - Create new post - Protected
router.post('/posts', authenticateToken, async (req, res) => {
    try {
        const { title, content, excerpt, cover_image, meta_description, meta_keywords, tags, author, category, published } = req.body;

        // Validate input
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content required' });
        }

        const slug = generateSlug(title);

        // Check for unique slug
        const [rows] = await db.execute('SELECT id FROM posts WHERE slug = ?', [slug]);
        const row = rows[0];
        
        if (row) {
            return res.status(400).json({ error: 'A post with this title/slug already exists' });
        }

        const isPublished = !!published; // boolean

        // Calculate reading time
        const wordCount = content.split(/\s+/).length;
        const reading_time = Math.ceil(wordCount / 200);

        const sql = `INSERT INTO posts (title, slug, content, excerpt, cover_image, meta_description, meta_keywords, tags, author, reading_time, category, published)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [title, slug, content, excerpt || '', cover_image || '', meta_description || excerpt || '', meta_keywords || '', tags || '', author || 'Admin', reading_time, category || 'Uncategorized', isPublished ? 1 : 0];
        
        const [result] = await db.execute(sql, params);
        
        // Return the created post
        const newPost = {
            id: result.insertId,
            title,
            slug,
            content,
            excerpt: excerpt || '',
            cover_image: cover_image || '',
            meta_description: meta_description || excerpt || '',
            meta_keywords: meta_keywords || '',
            tags: tags || '',
            author: author || 'Admin',
            reading_time,
            category: category || 'Uncategorized',
            published: isPublished ? 1 : 0
            // Remove created_at and updated_at since MySQL handles them automatically
        };
        
        res.status(201).json({
            success: true,
            post: newPost
        });
    } catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({ error: 'Database error' });
    }
});

// PUT /api/posts/:id - Update post - Protected
router.put('/posts/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, excerpt, cover_image, meta_description, meta_keywords, tags, author, category, published } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content required' });
        }

        const slug = generateSlug(title);
        const isPublished = !!published;

        // Check slug uniqueness (excluding current post)
        const [rows] = await db.execute('SELECT id FROM posts WHERE slug = ? AND id != ?', [slug, id]);
        const row = rows[0];
        
        if (row) {
            return res.status(400).json({ error: 'A post with this title already exists' });
        }

        const wordCount = content.split(/\s+/).length;
        const reading_time = Math.ceil(wordCount / 200);

        const sql = `UPDATE posts SET 
            title = ?, 
            slug = ?, 
            content = ?, 
            excerpt = ?, 
            cover_image = ?, 
            meta_description = ?, 
            meta_keywords = ?, 
            tags = ?, 
            author = ?, 
            reading_time = ?, 
            category = ?, 
            published = ?
            WHERE id = ?`;
            
        const params = [
            title, 
            slug, 
            content, 
            excerpt || '', 
            cover_image || '', 
            meta_description || excerpt || '', 
            meta_keywords || '', 
            tags || '', 
            author || 'Admin', 
            reading_time, 
            category || 'Uncategorized', 
            isPublished ? 1 : 0, 
            id
        ];

        const [result] = await db.execute(sql, params);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Return the updated post
        const updatedPost = {
            id: parseInt(id),
            title,
            slug,
            content,
            excerpt: excerpt || '',
            cover_image: cover_image || '',
            meta_description: meta_description || excerpt || '',
            meta_keywords: meta_keywords || '',
            tags: tags || '',
            author: author || 'Admin',
            reading_time,
            category: category || 'Uncategorized',
            published: isPublished ? 1 : 0
            // Remove updated_at since MySQL handles it automatically
        };
        
        res.json({
            success: true,
            post: updatedPost
        });
    } catch (error) {
        console.error('Error updating post:', error);
        return res.status(500).json({ error: 'Database error' });
    }
});

// DELETE /api/posts/:id - Delete post - Protected
router.delete('/posts/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.execute('DELETE FROM posts WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        res.json({ success: true, message: 'Post deleted' });
    } catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
