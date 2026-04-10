const { validationResult } = require('express-validator');
const Form = require('../models/Form');
const path = require('path');
const fs = require('fs');

const formsController = {
    // Get all forms
    getAllForms: async (req, res) => {
        try {
            const forms = await Form.find({})
                .populate('uploadedBy', 'username email')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: { forms }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get forms',
                error: error.message
            });
        }
    },

    // Get form by ID
    getFormById: async (req, res) => {
        try {
            const { id } = req.params;

            const form = await Form.findById(id)
                .populate('uploadedBy', 'username email');

            if (!form) {
                return res.status(404).json({
                    success: false,
                    message: 'Form not found'
                });
            }

            res.json({
                success: true,
                data: { form }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get form',
                error: error.message
            });
        }
    },

    // Create new form
    createForm: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array()
                });
            }

            const { employeeId, employeeName, actionCode, actionDate, department } = req.body;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Generate action code if not provided
            let finalActionCode = actionCode;
            if (!finalActionCode) {
                const count = await Form.countDocuments();
                finalActionCode = `ACT-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
            }

            const form = new Form({
                actionCode: finalActionCode,
                employeeId,
                employeeName,
                actionDate: new Date(actionDate),
                department,
                fileName: file.filename,
                filePath: `/uploads/${file.filename}`,
                uploadedBy: req.user._id
            });

            await form.save();
            await form.populate('uploadedBy', 'username email');

            res.status(201).json({
                success: true,
                message: 'Form created successfully',
                data: { form }
            });
        } catch (error) {
            // Clean up uploaded file if form creation fails
            if (req.file) {
                const filePath = path.join(__dirname, '../uploads', req.file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Action code already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to create form',
                error: error.message
            });
        }
    },

    // Update form
    updateForm: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Remove fields that shouldn't be updated
            delete updates.fileName;
            delete updates.filePath;
            delete updates.uploadedBy;

            const form = await Form.findByIdAndUpdate(
                id,
                { ...updates, updatedAt: new Date() },
                { new: true }
            ).populate('uploadedBy', 'username email');

            if (!form) {
                return res.status(404).json({
                    success: false,
                    message: 'Form not found'
                });
            }

            res.json({
                success: true,
                message: 'Form updated successfully',
                data: { form }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update form',
                error: error.message
            });
        }
    },

    // Delete form
    deleteForm: async (req, res) => {
        try {
            const { id } = req.params;

            const form = await Form.findById(id);

            if (!form) {
                return res.status(404).json({
                    success: false,
                    message: 'Form not found'
                });
            }

            // Delete the file from filesystem
            const filePath = path.join(__dirname, '../uploads', form.fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await Form.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Form deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete form',
                error: error.message
            });
        }
    },

    // Search forms
    searchForms: async (req, res) => {
        try {
            const { q } = req.query;

            if (!q) {
                return this.getAllForms(req, res);
            }

            const searchRegex = new RegExp(q, 'i');

            const forms = await Form.find({
                $or: [
                    { employeeId: searchRegex },
                    { employeeName: searchRegex },
                    { actionCode: searchRegex },
                    { department: searchRegex }
                ]
            })
            .populate('uploadedBy', 'username email')
            .sort({ createdAt: -1 });

            res.json({
                success: true,
                data: { forms }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Search failed',
                error: error.message
            });
        }
    }
};

module.exports = formsController;