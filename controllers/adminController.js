const { validationResult } = require('express-validator');
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

const adminController = {
    // User Management
    createUser: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { username, email, password, roleId } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email or username already exists'
                });
            }

            // Create new user
            const user = new User({
                username,
                email,
                password,
                role: roleId
            });

            await user.save();
            await user.populate('role');

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role.name,
                        isActive: user.isActive,
                        createdAt: user.createdAt
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to create user',
                error: error.message
            });
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const users = await User.find({})
                .populate('role', 'name description')
                .select('-password')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: { users }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get users',
                error: error.message
            });
        }
    },

    updateUser: async (req, res) => {
        try {
            const { userId } = req.params;
            const updates = req.body;

            // Remove sensitive fields
            delete updates.password;
            delete updates.email;

            const user = await User.findByIdAndUpdate(
                userId,
                { ...updates, updatedAt: new Date() },
                { new: true }
            ).populate('role', 'name description').select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'User updated successfully',
                data: { user }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update user',
                error: error.message
            });
        }
    },

    toggleUserStatus: async (req, res) => {
        try {
            const { userId } = req.params;
            const { isActive } = req.body;

            const user = await User.findByIdAndUpdate(
                userId,
                { isActive, updatedAt: new Date() },
                { new: true }
            ).populate('role', 'name description').select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
                data: { user }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to toggle user status',
                error: error.message
            });
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { userId } = req.params;

            const user = await User.findByIdAndDelete(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete user',
                error: error.message
            });
        }
    },

    assignRole: async (req, res) => {
        try {
            const { userId } = req.params;
            const { roleId } = req.body;

            const role = await Role.findById(roleId);
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }

            const user = await User.findByIdAndUpdate(
                userId,
                { role: roleId, updatedAt: new Date() },
                { new: true }
            ).populate('role', 'name description').select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'Role assigned successfully',
                data: { user }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to assign role',
                error: error.message
            });
        }
    },

    // Role Management
    createRole: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { name, description, permissions } = req.body;

            const role = new Role({
                name,
                description,
                permissions
            });

            await role.save();
            await role.populate('permissions');

            res.status(201).json({
                success: true,
                message: 'Role created successfully',
                data: { role }
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Role name already exists'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Failed to create role',
                error: error.message
            });
        }
    },

    getAllRoles: async (req, res) => {
        try {
            const roles = await Role.find({})
                .populate('permissions', 'name description resource action')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: { roles }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get roles',
                error: error.message
            });
        }
    },

    updateRole: async (req, res) => {
        try {
            const { roleId } = req.params;
            const { name, description, permissions } = req.body;

            const role = await Role.findByIdAndUpdate(
                roleId,
                { name, description, permissions, updatedAt: new Date() },
                { new: true }
            ).populate('permissions', 'name description resource action');

            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }

            res.json({
                success: true,
                message: 'Role updated successfully',
                data: { role }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update role',
                error: error.message
            });
        }
    },

    deleteRole: async (req, res) => {
        try {
            const { roleId } = req.params;

            // Check if role is being used by users
            const usersWithRole = await User.countDocuments({ role: roleId });
            if (usersWithRole > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete role that is assigned to users'
                });
            }

            const role = await Role.findByIdAndDelete(roleId);

            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found'
                });
            }

            res.json({
                success: true,
                message: 'Role deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete role',
                error: error.message
            });
        }
    },

    // Permission Management
    createPermission: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { name, description, resource, action } = req.body;

            const permission = new Permission({
                name,
                description,
                resource,
                action
            });

            await permission.save();

            res.status(201).json({
                success: true,
                message: 'Permission created successfully',
                data: { permission }
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Permission already exists'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Failed to create permission',
                error: error.message
            });
        }
    },

    getAllPermissions: async (req, res) => {
        try {
            const permissions = await Permission.find({})
                .sort({ resource: 1, action: 1 });

            res.json({
                success: true,
                data: { permissions }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get permissions',
                error: error.message
            });
        }
    }
};

module.exports = adminController;