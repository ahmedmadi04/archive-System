const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(authorize('users_manage', 'roles_manage', 'permissions_manage'));

// User management validation
const createUserValidation = [
    body('username')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('roleId')
        .isMongoId()
        .withMessage('Valid role ID is required')
];

// Role management validation
const createRoleValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Role name is required'),
    body('permissions')
        .isArray()
        .withMessage('Permissions must be an array of permission IDs')
];

// Permission management validation
const createPermissionValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Permission name is required'),
    body('resource')
        .trim()
        .notEmpty()
        .withMessage('Resource is required'),
    body('action')
        .isIn(['create', 'read', 'update', 'delete', 'manage'])
        .withMessage('Action must be one of: create, read, update, delete, manage')
];

// User Management Routes
router.post('/users', createUserValidation, adminController.createUser);
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId', adminController.updateUser);
router.patch('/users/:userId/status', adminController.toggleUserStatus);
router.delete('/users/:userId', adminController.deleteUser);
router.put('/users/:userId/role', adminController.assignRole);

// Role Management Routes
router.post('/roles', createRoleValidation, adminController.createRole);
router.get('/roles', adminController.getAllRoles);
router.put('/roles/:roleId', adminController.updateRole);
router.delete('/roles/:roleId', adminController.deleteRole);

// Permission Management Routes
router.post('/permissions', createPermissionValidation, adminController.createPermission);
router.get('/permissions', adminController.getAllPermissions);

module.exports = router;