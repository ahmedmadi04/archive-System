const { Router } = require('express');
const { adminService } = require('../admin/admin.service');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');

const router = Router();

// Apply auth middleware to all admin routes
router.use(authMiddleware);

router.get('/users', requirePermission('users_manage'), async (req, res) => {
  try {
    const result = await adminService.getAllUsers();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/users', requirePermission('users_manage'), async (req, res) => {
  try {
    const result = await adminService.createUser(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/roles', requirePermission('roles_manage'), async (req, res) => {
  try {
    const result = await adminService.getAllRoles();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/roles', requirePermission('roles_manage'), async (req, res) => {
  try {
    const result = await adminService.createRole(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
