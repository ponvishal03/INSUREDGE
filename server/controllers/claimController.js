const Claim = require('../models/Claim');

// Submit a new claim
exports.submitClaim = async (req, res) => {
    try {
        const {
            policyId,
            walletAddress,
            claimType,
            amount,
            description,
            documents,
            transactionHash,
            policyType
        } = req.body;

        const claim = new Claim({
            policyId,
            walletAddress,
            claimType,
            amount,
            description,
            documents,
            transactionHash,
            policyType,
            status: 'pending'
        });

        await claim.save();
        res.status(201).json({ success: true, data: claim });
    } catch (error) {
        console.error('Error submitting claim:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get all claims
exports.getClaims = async (req, res) => {
    try {
        const claims = await Claim.find().sort({ submissionDate: -1 });
        res.status(200).json({ success: true, data: claims });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get claims by wallet address
exports.getClaimsByWallet = async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const claims = await Claim.find({ walletAddress }).sort({ submissionDate: -1 });
        res.status(200).json({ success: true, data: claims });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update claim status
exports.updateClaimStatus = async (req, res) => {
    try {
        const { policyId } = req.params;
        const { status } = req.body;

        const claim = await Claim.findOneAndUpdate(
            { policyId },
            { status },
            { new: true, runValidators: true }
        );

        if (!claim) {
            return res.status(404).json({ success: false, error: 'Claim not found' });
        }

        res.status(200).json({ success: true, data: claim });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}; 