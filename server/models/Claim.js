const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
    policyId: {
        type: String,
        required: true
    },
    walletAddress: {
        type: String,
        required: true
    },
    claimType: {
        type: String,
        required: true,
        enum: ['death', 'medical', 'accident']
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    documents: [{
        name: String,
        size: Number,
        type: String
    }],
    status: {
        type: String,
        required: true,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    submissionDate: {
        type: Date,
        default: Date.now
    },
    transactionHash: {
        type: String,
        required: true
    },
    policyType: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Claim', claimSchema); 