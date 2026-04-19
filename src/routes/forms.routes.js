const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const { formsService } = require('../forms/forms.service');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/role.middleware');

const router = Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Protect all form routes
router.use(authMiddleware);

router.get('/', requirePermission('forms_read'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    
    const result = await formsService.getAllForms(filter);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/archived', requirePermission('forms_read'), async (req, res) => {
  try {
    const result = await formsService.getAllForms({ status: 'Archived' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', requirePermission('forms_create'), upload.single('pdfFile'), async (req, res) => {
  try {
    const result = await formsService.createForm(req.body, req.file, req.user);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.patch('/:id/status', requirePermission('forms_update'), async (req, res) => {
  try {
    const result = await formsService.updateFormStatus(req.params.id, req.body.status);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/:id', requirePermission('forms_delete'), async (req, res) => {
  try {
    const result = await formsService.deleteForm(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
