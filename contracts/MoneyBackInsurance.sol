// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract MoneyBackInsurance is ReentrancyGuard, Ownable, Pausable {
    struct Policy {
        address policyholder;
        uint256 sumAssured;
        uint256 premium;
        uint256 startDate;
        uint256 endDate;
        bool isActive;
        bool isClaimed;
        uint256 lastPremiumPaid;
        bool payout5thYear;
        bool payout10thYear;
        bool payout15thYear;
        bool maturityPaid;
    }

    // Mapping from policy ID to Policy struct
    mapping(uint256 => Policy) public policies;
    uint256 public policyCount;
    
    // Events
    event PremiumPaid(uint256 indexed policyId, address indexed policyholder, uint256 amount);
    event PolicyCreated(uint256 indexed policyId, address indexed policyholder, uint256 sumAssured);
    event PayoutProcessed(uint256 indexed policyId, uint256 year, uint256 amount);
    event ClaimSubmitted(uint256 indexed policyId, address indexed policyholder);
    event ClaimProcessed(uint256 indexed policyId, bool approved, uint256 amount);
    
    // Constants
    uint256 public constant PREMIUM_RATE = 1499; // ₹1,499 per month
    uint256 public constant POLICY_DURATION = 20 * 365 days; // 20 years
    uint256 public constant PAYOUT_5TH_YEAR = 5 * 365 days;
    uint256 public constant PAYOUT_10TH_YEAR = 10 * 365 days;
    uint256 public constant PAYOUT_15TH_YEAR = 15 * 365 days;
    uint256 public constant CLAIM_VERIFICATION_PERIOD = 30 days;
    
    constructor() {
        policyCount = 0;
    }
    
    // Create new policy
    function createPolicy(uint256 _sumAssured) external payable whenNotPaused {
        require(msg.value >= PREMIUM_RATE, "Insufficient premium payment");
        require(_sumAssured >= 1500000, "Minimum sum assured is 15 Lakhs");
        
        uint256 policyId = policyCount++;
        
        policies[policyId] = Policy({
            policyholder: msg.sender,
            sumAssured: _sumAssured,
            premium: PREMIUM_RATE,
            startDate: block.timestamp,
            endDate: block.timestamp + POLICY_DURATION,
            isActive: true,
            isClaimed: false,
            lastPremiumPaid: block.timestamp,
            payout5thYear: false,
            payout10thYear: false,
            payout15thYear: false,
            maturityPaid: false
        });
        
        emit PolicyCreated(policyId, msg.sender, _sumAssured);
        emit PremiumPaid(policyId, msg.sender, msg.value);
    }
    
    // Pay premium
    function payPremium(uint256 _policyId) external payable whenNotPaused nonReentrant {
        Policy storage policy = policies[_policyId];
        require(policy.policyholder == msg.sender, "Not policyholder");
        require(policy.isActive, "Policy not active");
        require(msg.value >= policy.premium, "Insufficient premium payment");
        
        policy.lastPremiumPaid = block.timestamp;
        emit PremiumPaid(_policyId, msg.sender, msg.value);
        
        // Check and process payouts
        checkAndProcessPayouts(_policyId);
    }
    
    // Check and process payouts
    function checkAndProcessPayouts(uint256 _policyId) internal {
        Policy storage policy = policies[_policyId];
        uint256 timeElapsed = block.timestamp - policy.startDate;
        
        // 5th year payout (15%)
        if (!policy.payout5thYear && timeElapsed >= PAYOUT_5TH_YEAR) {
            uint256 payoutAmount = (policy.sumAssured * 15) / 100;
            processPayout(_policyId, payoutAmount, 5);
            policy.payout5thYear = true;
        }
        
        // 10th year payout (15%)
        if (!policy.payout10thYear && timeElapsed >= PAYOUT_10TH_YEAR) {
            uint256 payoutAmount = (policy.sumAssured * 15) / 100;
            processPayout(_policyId, payoutAmount, 10);
            policy.payout10thYear = true;
        }
        
        // 15th year payout (15%)
        if (!policy.payout15thYear && timeElapsed >= PAYOUT_15TH_YEAR) {
            uint256 payoutAmount = (policy.sumAssured * 15) / 100;
            processPayout(_policyId, payoutAmount, 15);
            policy.payout15thYear = true;
        }
        
        // Maturity payout (55%)
        if (!policy.maturityPaid && timeElapsed >= POLICY_DURATION) {
            uint256 payoutAmount = (policy.sumAssured * 55) / 100;
            processPayout(_policyId, payoutAmount, 20);
            policy.maturityPaid = true;
            policy.isActive = false;
        }
    }
    
    // Process payout
    function processPayout(uint256 _policyId, uint256 _amount, uint256 _year) internal {
        require(address(this).balance >= _amount, "Insufficient contract balance");
        Policy storage policy = policies[_policyId];
        
        (bool success, ) = policy.policyholder.call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit PayoutProcessed(_policyId, _year, _amount);
    }
    
    // Submit claim
    function submitClaim(uint256 _policyId) external whenNotPaused {
        Policy storage policy = policies[_policyId];
        require(policy.policyholder == msg.sender, "Not policyholder");
        require(policy.isActive, "Policy not active");
        require(!policy.isClaimed, "Claim already processed");
        require(block.timestamp <= policy.endDate, "Policy expired");
        
        policy.isClaimed = true;
        emit ClaimSubmitted(_policyId, msg.sender);
    }
    
    // Process claim (only owner)
    function processClaim(uint256 _policyId, bool _approved) external onlyOwner whenNotPaused {
        Policy storage policy = policies[_policyId];
        require(policy.isClaimed, "No claim submitted");
        
        if (_approved) {
            require(address(this).balance >= policy.sumAssured, "Insufficient contract balance");
            (bool success, ) = policy.policyholder.call{value: policy.sumAssured}("");
            require(success, "Transfer failed");
        }
        
        policy.isActive = false;
        emit ClaimProcessed(_policyId, _approved, _approved ? policy.sumAssured : 0);
    }
    
    // Get policy details
    function getPolicy(uint256 _policyId) external view returns (
        address policyholder,
        uint256 sumAssured,
        uint256 premium,
        uint256 startDate,
        uint256 endDate,
        bool isActive,
        bool isClaimed,
        uint256 lastPremiumPaid,
        bool payout5thYear,
        bool payout10thYear,
        bool payout15thYear,
        bool maturityPaid
    ) {
        Policy storage policy = policies[_policyId];
        return (
            policy.policyholder,
            policy.sumAssured,
            policy.premium,
            policy.startDate,
            policy.endDate,
            policy.isActive,
            policy.isClaimed,
            policy.lastPremiumPaid,
            policy.payout5thYear,
            policy.payout10thYear,
            policy.payout15thYear,
            policy.maturityPaid
        );
    }
    
    // Pause contract in emergency
    function pause() external onlyOwner {
        _pause();
    }
    
    // Unpause contract
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Withdraw funds (only owner)
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }
    
    // Receive function to accept ETH
    receive() external payable {}
} 