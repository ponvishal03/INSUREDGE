const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    walletAddress: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: String
    },
    documents: {
        panCard: String,
        aadharCard: String
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'kyc' });

// Add pre-save middleware to prevent wallet address changes
kycSchema.pre('save', function(next) {
    if (!this.isNew && this.isModified('walletAddress')) {
        next(new Error('Wallet address cannot be changed after registration'));
    }
    next();
});

const KYC = mongoose.model('KYC', kycSchema);
module.exports = KYC; 