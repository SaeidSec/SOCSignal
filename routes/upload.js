const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for disk storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'img-' + uniqueSuffix + path.extname(file.originalname);
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max file size
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// POST /api/upload - Upload image to local storage - Protected
router.post('/upload', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: 0, error: 'No file uploaded' });
    }

    // Generate public URL
    const publicUrl = `/uploads/${req.file.filename}`;

    res.json({
        success: 1,
        url: publicUrl,
        filename: req.file.filename
    });
});

// DELETE /api/upload/:filename - Delete uploaded image - Protected
router.delete('/upload/:filename', authenticateToken, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'public', 'uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Image not found' });
    }

    // Delete the file
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Delete error:', err);
            return res.status(500).json({ error: 'Delete failed' });
        }

        res.json({ success: true, message: 'Image deleted' });
    });
});

module.exports = router;
