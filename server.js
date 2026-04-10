require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { body } = require('express-validator');
const connectDB = require('./config/database');
const authController = require('./controllers/authController');
const auth = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const formsRoutes = require('./routes/forms');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'mabruk-oil-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Static files
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/forms', formsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate field value'
        });
    }

    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║           Mabruk Oil Operations - HR System    ║
╠════════════════════════════════════════════════╣
║   Server running on: http://localhost:${PORT}    ║
║   Environment: ${process.env.NODE_ENV || 'development'}    ║
║                                                ║
║   API Endpoints:                               ║
║   Auth: /api/auth/*                            ║
║   Admin: /api/admin/*                          ║
║   Forms: /api/forms/*                          ║
║                                                ║
║   Admin Credentials:                           ║
║   Email: admin                    ║
║   Password: admin123                           ║
╚════════════════════════════════════════════════╝
    `);
});