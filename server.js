require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', authRoutes);
app.use('/api', postsRoutes);
app.use('/api', uploadRoutes);

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
initDatabase()
    .then(() => {
        console.log('Database initialized successfully');

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`Admin login: http://localhost:${PORT}/admin/login.html`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
