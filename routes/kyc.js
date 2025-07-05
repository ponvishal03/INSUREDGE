const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const KYC = require('../models/KYC');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/kyc';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Submit KYC
router.post('/submit', auth, upload.fields([
    { name: 'panCard', maxCount: 1 },
    { name: 'aadhaarCard', maxCount: 1 }
]), async (req, res) => {
    try {
        // Get user from database
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if KYC already exists for this user
        const existingKYC = await KYC.findOne({ userId: req.user.id });
        if (existingKYC) {
            return res.status(400).json({
                success: false,
                message: 'KYC already exists for this user'
            });
        }

        // Validate wallet address
        if (!req.body.walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }

        // Check if wallet address is already registered
        const existingWalletKYC = await KYC.findOne({ walletAddress: req.body.walletAddress });
        if (existingWalletKYC) {
            return res.status(400).json({
                success: false,
                message: 'This wallet address is already registered with another user'
            });
        }

        // Handle file uploads
        let panCardPath = null;
        let aadhaarCardPath = null;

        if (req.files) {
            if (req.files['panCard']) {
                panCardPath = req.files['panCard'][0].path;
            }
            if (req.files['aadhaarCard']) {
                aadhaarCardPath = req.files['aadhaarCard'][0].path;
            }
        }

        // Create KYC document
        const kycData = {
            userId: req.user.id,
            walletAddress: req.body.walletAddress,
            fullName: req.body.fullName,
            email: req.body.email,
            phone: req.body.phone,
            dateOfBirth: req.body.dateOfBirth,
            address: {
                street: req.body.street,
                city: req.body.city,
                state: req.body.state,
                pincode: req.body.pincode,
                country: req.body.country
            },
            documents: {
                panCard: panCardPath,
                aadhaarCard: aadhaarCardPath
            },
            status: 'pending',
            submittedAt: new Date()
        };

        // Save KYC data
        const kyc = new KYC(kycData);
        await kyc.save();

        console.log('KYC data saved successfully:', kyc);

        res.json({
            success: true,
            message: 'KYC submitted successfully',
            kyc: kyc
        });
    } catch (error) {
        console.error('KYC submission error:', error);
        if (error.code === 11000) { // MongoDB duplicate key error
            return res.status(400).json({
                success: false,
                message: 'This wallet address or email is already registered'
            });
        }
        if (error.message === 'Wallet address cannot be changed after registration') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error submitting KYC',
            error: error.message
        });
    }
});

// Get KYC status
router.get('/status', auth, async (req, res) => {
    try {
        const kyc = await KYC.findOne({ userId: req.user.id });
        if (!kyc) {
            return res.json(null);
        }
        res.json(kyc);
    } catch (error) {
        console.error('Error fetching KYC status:', error);
        res.status(500).json({ message: 'Error fetching KYC status' });
    }
});

// Update KYC status (admin only)
router.put('/update-status/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { status, rejectionReason } = req.body;
        const kyc = await KYC.findById(req.params.id);

        if (!kyc) {
            return res.status(404).json({ message: 'KYC not found' });
        }

        kyc.status = status;
        kyc.rejectionReason = rejectionReason;
        kyc.verifiedBy = req.user.id;
        await kyc.save();

        res.json({ message: 'KYC status updated successfully' });
    } catch (error) {
        console.error('Error updating KYC status:', error);
        res.status(500).json({ message: 'Error updating KYC status' });
    }
});

// Get all KYC submissions (admin only)
router.get('/all', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const kycs = await KYC.find()
            .populate('userId', 'full_name email')
            .populate('verifiedBy', 'full_name')
            .sort({ submittedAt: -1 });

        res.json(kycs);
    } catch (error) {
        console.error('Error fetching KYC submissions:', error);
        res.status(500).json({ message: 'Error fetching KYC submissions' });
    }
});

module.exports = router; 