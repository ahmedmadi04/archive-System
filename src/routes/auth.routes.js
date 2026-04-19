const { Router } = require('express');
const { authService } = require('../auth/auth.service');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
});

router.post('/logout', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

router.get('/check-auth', authMiddleware, async (req, res) => {
  const result = await authService.getProfile(req.user);
  res.json(result);
});

router.get('/profile', authMiddleware, async (req, res) => {
  const result = await authService.getProfile(req.user);
  res.json(result);
});

module.exports = router;
