const express = require('express');
const multer = require('multer');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Initialize database file
const dbPath = path.join(dataDir, 'forms.json');
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([], null, 2));
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadsDir));

// Session configuration
app.use(session({
    secret: 'mabruk-oil-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'form-' + uniqueSuffix + '.pdf');
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Authentication credentials
const VALID_USER = {
    username: 'Rfarg',
    password: 'mabruk@oil'
};

// Helper functions
function readDatabase() {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
}

function writeDatabase(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === VALID_USER.username && password === VALID_USER.password) {
        req.session.authenticated = true;
        req.session.username = username;
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/check-auth', (req, res) => {
    if (req.session.authenticated) {
        res.json({ authenticated: true, username: req.session.username });
    } else {
        res.json({ authenticated: false });
    }
});

app.get('/api/forms', (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const forms = readDatabase();
    res.json(forms);
});

app.post('/api/upload', upload.single('pdfFile'), (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const { employeeId, employeeName, actionCode, actionDate, department } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const forms = readDatabase();
        
        const newForm = {
            id: Date.now().toString(),
            actionCode: actionCode || `ACT-${new Date().getFullYear()}-${String(forms.length + 1).padStart(3, '0')}`,
            employeeId,
            employeeName,
            actionDate,
            department,
            fileName: file.filename,
            filePath: `/uploads/${file.filename}`,
            uploadDate: new Date().toISOString(),
            status: 'Active'
        };

        forms.push(newForm);
        writeDatabase(forms);

        res.json({ success: true, form: newForm });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/forms/:id', (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const { id } = req.params;
        let forms = readDatabase();
        
        const formIndex = forms.findIndex(f => f.id === id);
        if (formIndex === -1) {
            return res.status(404).json({ error: 'Form not found' });
        }

        const form = forms[formIndex];
        
        const filePath = path.join(__dirname, 'uploads', form.fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        forms.splice(formIndex, 1);
        writeDatabase(forms);

        res.json({ success: true, message: 'Form deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/search', (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { q } = req.query;
    const forms = readDatabase();
    
    if (!q) {
        return res.json(forms);
    }

    const query = q.toLowerCase();
    const results = forms.filter(form => 
        form.employeeId.toLowerCase().includes(query) ||
        form.employeeName.toLowerCase().includes(query) ||
        form.actionCode.toLowerCase().includes(query) ||
        form.department.toLowerCase().includes(query)
    );

    res.json(results);
});

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║   Mabruk Oil Operations - HR System Server    ║
╠════════════════════════════════════════════════╣
║   Server running on: http://localhost:${PORT}    ║
║   Login URL: http://localhost:${PORT}/            ║
║                                                ║
║   Credentials:                                 ║
║   Username: Rfarg                              ║
║   Password: mabruk@oil                         ║
╚════════════════════════════════════════════════╝
    `);
});