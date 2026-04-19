const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Register Mongoose schemas
require('./schemas/user.schema');
require('./schemas/role.schema');
require('./schemas/permission.schema');
require('./schemas/form.schema');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const formsRoutes = require('./routes/forms.routes');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Redirection middleware
app.use((req, res, next) => {
  if (req.url === '/' || req.url === '/index.html') {
    return res.redirect('/html/index.html');
  }
  if (req.url === '/dashboard.html') {
    return res.redirect('/html/dashboard.html');
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/forms', formsRoutes);

// Fix for legacy controller paths if needed
app.use('/api', authRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
