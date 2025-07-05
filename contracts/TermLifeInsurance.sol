// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract TermLifeInsurance is ReentrancyGuard, Ownable, Pausable {
    struct Policy {
        address policyholder;
        uint256 sumAssured;
        uint256 premium;
        uint256 startDate;
        uint256 endDate;
        bool isActive;
        bool isClaimed;
        uint256 lastPremiumPaid;
    }

    // Mapping from policy ID to Policy struct
    mapping(uint256 => Policy) public policies;
    uint256 public policyCount;
    
    // Premium payment events
    event PremiumPaid(uint256 indexed policyId, address indexed policyholder, uint256 amount);
    event PolicyCreated(uint256 indexed policyId, address indexed policyholder, uint256 sumAssured);
    event PolicyRenewed(uint256 indexed policyId, uint256 newEndDate);
    event ClaimSubmitted(uint256 indexed policyId, address indexed policyholder);
    event ClaimProcessed(uint256 indexed policyId, bool approved, uint256 amount);
    
    // Constants
    uint256 public constant PREMIUM_RATE = 499; // ₹499 per month
    uint256 public constant POLICY_DURATION = 365 days;
    uint256 public constant CLAIM_VERIFICATION_PERIOD = 30 days;
    
    constructor() {
        policyCount = 0;
    }
    
    // Create new policy
    function createPolicy(uint256 _sumAssured) external payable whenNotPaused returns (uint256) {
        require(msg.value >= PREMIUM_RATE, "Insufficient premium payment");
        require(_sumAssured >= 1000000, "Minimum sum assured is 1 Cr");
        
        uint256 policyId = policyCount++;
        
        policies[policyId] = Policy({
            policyholder: msg.sender,
            sumAssured: _sumAssured,
            premium: PREMIUM_RATE,
            startDate: block.timestamp,
            endDate: block.timestamp + POLICY_DURATION,
            isActive: true,
            isClaimed: false,
            lastPremiumPaid: block.timestamp
        });
        
        emit PolicyCreated(policyId, msg.sender, _sumAssured);
        emit PremiumPaid(policyId, msg.sender, msg.value);
        
        return policyId;
    }
    
    // Pay premium for policy renewal
    function payPremium(uint256 _policyId) external payable whenNotPaused nonReentrant {
        Policy storage policy = policies[_policyId];
        require(policy.policyholder == msg.sender, "Not policyholder");
        require(policy.isActive, "Policy not active");
        require(msg.value >= policy.premium, "Insufficient premium payment");
        
        policy.lastPremiumPaid = block.timestamp;
        policy.endDate = block.timestamp + POLICY_DURATION;
        
        emit PremiumPaid(_policyId, msg.sender, msg.value);
        emit PolicyRenewed(_policyId, policy.endDate);
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
        uint256 lastPremiumPaid
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
            policy.lastPremiumPaid
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