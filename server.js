const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure uploads directory exists
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads', { recursive: true });
        }
        console.log('File will be uploaded to:', path.resolve('uploads'));
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Create a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = file.fieldname + '-' + uniqueSuffix + ext;
        console.log('Generated filename:', filename);
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images and PDFs only
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        console.log('File accepted:', file.originalname, file.mimetype);
        cb(null, true);
    } else {
        console.log('File rejected:', file.originalname, file.mimetype);
        cb(new Error('Only images and PDF files are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory at:', uploadDir);
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
let dbConnected = false;

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'insuranceApp'
})
.then(async () => {
    console.log('=== MongoDB Connection Details ===');
    console.log('Connected to MongoDB Atlas');
    console.log('Database Name:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    
    dbConnected = true;
    
    // List all collections
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\nAvailable collections:', collections.map(c => c.name));
        
        // Get documents count in each collection
        for (const collection of collections) {
            const count = await mongoose.connection.db.collection(collection.name).countDocuments();
            console.log(`${collection.name}: ${count} documents`);
        }
        
        // Verify KYC model is registered
        const models = mongoose.modelNames();
        console.log('\nRegistered models:', models);
        
        // Verify indexes on KYC collection
        const kycIndexes = await KYC.collection.getIndexes();
        console.log('\nKYC collection indexes:', kycIndexes);
        
    } catch (err) {
        console.error('Error checking collections:', err);
    }
})
.catch((error) => {
    console.error('=== MongoDB Connection Error ===');
    console.error('Error details:', error);
    console.error('Connection string:', process.env.MONGODB_URI.replace(/:[^:@]*@/, ':****@'));
    dbConnected = false;
});

// Middleware to check DB connection
const checkDbConnection = (req, res, next) => {
    if (!dbConnected) {
        console.error('Database connection check failed');
        return res.status(503).json({ 
            message: 'Database connection not available',
            dbStatus: {
                connected: dbConnected,
                name: mongoose.connection.name,
                host: mongoose.connection.host,
                readyState: mongoose.connection.readyState
            }
        });
    }
    next();
};

// Apply DB check middleware to all API routes
app.use('/api', checkDbConnection);

// Import models
const User = require('./models/User');
const KYC = require('./models/KYC');

// Auth middleware
const auth = require('./middleware/auth');

// Authentication Routes
        app.post('/api/signup', async (req, res) => {
            try {
                console.log('Received signup request:', { ...req.body, password: '[REDACTED]' });
                const { fullName, email, password } = req.body;

        // Validate input
                if (!fullName || !email || !password) {
                    return res.status(400).json({ message: 'All fields are required' });
                }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
                }
                
                // Check if user exists
        const existingUser = await User.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({ message: 'Email already registered' });
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Create user
        const user = new User({
                    full_name: fullName,
                    email: email,
            password: hashedPassword
        });

        await user.save();

                    // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

                    res.status(201).json({
                        token,
                        user: {
                id: user._id,
                fullName: user.full_name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
        }
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

        app.post('/api/login', async (req, res) => {
            try {
                console.log('Received login request:', { ...req.body, password: '[REDACTED]' });
                const { email, password } = req.body;

                // Find user
        const user = await User.findOne({ email });
                if (!user) {
                    return res.status(400).json({ message: 'Invalid credentials' });
                }

                // Check password
                const validPassword = await bcrypt.compare(password, user.password);
                if (!validPassword) {
                    return res.status(400).json({ message: 'Invalid credentials' });
                }

                // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

                res.json({
                    token,
                    user: {
                        id: user._id,
                        fullName: user.full_name,
                        email: user.email
                    }
                });
            } catch (error) {
                console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

app.get('/api/verify', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
                if (!user) {
            return res.status(401).json({ message: 'User not found' });
                }

                res.json({
                    valid: true,
                    user: {
                        id: user._id,
                        fullName: user.full_name,
                        email: user.email
                    }
                });
            } catch (error) {
                console.error('Token verification error:', error);
                res.status(401).json({ message: 'Invalid token' });
            }
        });

// KYC Routes
app.post('/api/kyc/submit', auth, upload.fields([
    { name: 'panCard', maxCount: 1 },
    { name: 'aadharCard', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('=== KYC Submission Start ===');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('User from token:', JSON.stringify(req.user, null, 2));
        console.log('Form data:', JSON.stringify(req.body, null, 2));
        console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
        
        if (!req.files || !req.files.panCard || !req.files.aadharCard) {
            console.error('Missing required files');
            return res.status(400).json({
                success: false,
                message: 'Both PAN Card and Aadhaar Card files are required'
            });
        }

        console.log('PAN Card file:', {
            filename: req.files.panCard[0].filename,
            path: req.files.panCard[0].path,
            size: req.files.panCard[0].size
        });
        console.log('Aadhaar Card file:', {
            filename: req.files.aadharCard[0].filename,
            path: req.files.aadharCard[0].path,
            size: req.files.aadharCard[0].size
        });
        
        const user = await User.findById(req.user.userId);
        console.log('Found user:', JSON.stringify(user, null, 2));
        
        if (!user) {
            console.log('User not found with ID:', req.user.userId);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if KYC already exists
        const existingKYC = await KYC.findOne({ userId: req.user.userId });
        console.log('Existing KYC check:', JSON.stringify(existingKYC, null, 2));
        
        if (existingKYC) {
            console.log('KYC already exists for user:', req.user.userId);
            return res.status(400).json({ success: false, message: 'KYC already exists for this user' });
        }

        // Validate required fields
        const requiredFields = ['walletAddress', 'fullName', 'email', 'phone', 'dateOfBirth'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            console.log('Missing required fields:', missingFields);
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Create KYC document
        const kycData = {
            userId: req.user.userId,
            walletAddress: req.body.walletAddress,
            fullName: req.body.fullName,
            email: req.body.email,
            phone: req.body.phone,
            dateOfBirth: new Date(req.body.dateOfBirth),
            address: {
                street: req.body.street || '',
                city: req.body.city || '',
                state: req.body.state || '',
                pincode: req.body.pincode || '',
                country: req.body.country || ''
            },
            documents: {
                panCard: `/uploads/${req.files.panCard[0].filename}`,
                aadharCard: `/uploads/${req.files.aadharCard[0].filename}`
            },
            status: 'pending'
        };

        console.log('Attempting to create KYC document with data:', JSON.stringify(kycData, null, 2));

        const kyc = new KYC(kycData);
        console.log('Created KYC model instance:', JSON.stringify(kyc, null, 2));
        
        // Validate the document before saving
        const validationError = kyc.validateSync();
        if (validationError) {
            console.error('Validation error:', validationError);
            // Delete uploaded files if validation fails
            try {
                fs.unlinkSync(req.files.panCard[0].path);
                fs.unlinkSync(req.files.aadharCard[0].path);
            } catch (unlinkError) {
                console.error('Error deleting files after validation failure:', unlinkError);
            }
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationError.errors
            });
        }

        // Try to save with error handling
        try {
            await kyc.save();
            console.log('KYC saved successfully:', JSON.stringify(kyc.toObject(), null, 2));
        } catch (saveError) {
            console.error('Error saving KYC:', saveError);
            // Delete uploaded files if save fails
            try {
                fs.unlinkSync(req.files.panCard[0].path);
                fs.unlinkSync(req.files.aadharCard[0].path);
            } catch (unlinkError) {
                console.error('Error deleting files after save failure:', unlinkError);
            }
            if (saveError.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Wallet address already registered for KYC'
                });
            }
            throw saveError;
        }

        res.json({
            success: true,
            message: 'KYC submitted successfully',
            kyc: kyc
        });
    } catch (error) {
        console.error('=== KYC Submission Error ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        console.error('Error stack:', error.stack);
        
        // Delete uploaded files if there's an error
        if (req.files) {
            try {
                if (req.files.panCard) fs.unlinkSync(req.files.panCard[0].path);
                if (req.files.aadharCard) fs.unlinkSync(req.files.aadharCard[0].path);
            } catch (unlinkError) {
                console.error('Error deleting files after error:', unlinkError);
            }
        }
        
                res.status(500).json({
                    success: false,
                    message: 'Error submitting KYC',
                    error: error.message
                });
            }
        });

// Get KYC Status
app.get('/api/kyc/status', auth, async (req, res) => {
    try {
        const kyc = await KYC.findOne({ userId: req.user.userId });
        res.json(kyc);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching KYC status' });
    }
});

// Simple Admin Route for KYC Verification (Demo Only)
app.get('/api/kyc/verify/:userId', async (req, res) => {
    try {
        console.log('Verifying KYC for user:', req.params.userId);
        
        const kyc = await KYC.findOne({ userId: req.params.userId });
        if (!kyc) {
            return res.status(404).json({
                success: false,
                message: 'KYC not found'
            });
        }

        // Update KYC status to verified
        kyc.status = 'verified';
        await kyc.save();

        console.log('KYC verified successfully:', kyc);

        res.json({
            success: true,
            message: 'KYC verified successfully',
            kyc: kyc
        });
    } catch (error) {
        console.error('Error verifying KYC:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying KYC',
            error: error.message
        });
    }
});

// Get all KYC submissions
app.get('/api/kyc/all', auth, async (req, res) => {
    try {
        console.log('Fetching all KYC submissions');
        const kycs = await KYC.find().sort({ createdAt: -1 });
        
        console.log(`Found ${kycs.length} KYC submissions`);
        
        // Map the KYC data to include only necessary fields
        const mappedKycs = kycs.map(kyc => ({
            userId: kyc.userId,
            fullName: kyc.fullName,
            email: kyc.email,
            phone: kyc.phone,
            dateOfBirth: kyc.dateOfBirth,
            status: kyc.status,
            createdAt: kyc.createdAt,
            documents: {
                panCard: kyc.documents.panCard,
                aadharCard: kyc.documents.aadharCard
            }
        }));

        res.json(mappedKycs);
    } catch (error) {
        console.error('Error fetching KYC submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching KYC submissions',
            error: error.message
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Visit InsurEdge at: http://localhost:${port}`);
    console.log('Make sure to use this URL in your browser to access the website');
});