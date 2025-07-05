const express = require('express');
const router = express.Router();
const {
    submitClaim,
    getClaims,
    getClaimsByWallet,
    updateClaimStatus
} = require('../controllers/claimController');

// Submit a new claim
router.post('/', submitClaim);

// Get all claims
router.get('/', getClaims);

// Get claims by wallet address
router.get('/wallet/:walletAddress', getClaimsByWallet);

// Update claim status
router.patch('/:policyId/status', updateClaimStatus);

module.exports = router; 