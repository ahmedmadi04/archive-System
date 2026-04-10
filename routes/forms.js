const express = require('express');
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');
const formsController = require('../controllers/formsController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'form-' + uniqueSuffix + '.pdf');
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Validation rules
const createFormValidation = [
    body('employeeId')
        .trim()
        .notEmpty()
        .withMessage('Employee ID is required'),
    body('employeeName')
        .trim()
        .notEmpty()
        .withMessage('Employee name is required'),
    body('actionDate')
        .isISO8601()
        .withMessage('Valid action date is required'),
    body('department')
        .trim()
        .notEmpty()
        .withMessage('Department is required')
];

// Routes
router.get('/', auth, authorize('forms_read'), formsController.getAllForms);
router.get('/search', auth, authorize('forms_read'), formsController.searchForms);
router.get('/:id', auth, authorize('forms_read'), formsController.getFormById);
router.post('/', auth, authorize('forms_create'), upload.single('pdfFile'), createFormValidation, formsController.createForm);
router.put('/:id', auth, authorize('forms_update'), formsController.updateForm);
router.delete('/:id', auth, authorize('forms_delete'), formsController.deleteForm);

module.exports = router;