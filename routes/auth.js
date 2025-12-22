const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/login - Admin login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        // Find user in database
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
