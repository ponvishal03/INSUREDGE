// Wallet connection state
let userWallet = null;
let userAddress = null;
let contracts = null;

// Network configuration
const NETWORK_CONFIG = {
    chainId: '0x539', // 1337 for local Ganache
    chainName: 'Local Ganache',
    rpcUrls: ['http://127.0.0.1:8545'],
    nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
    }
};

// Contract addresses (replace with your deployed contract addresses)
const TERM_LIFE_CONTRACT_ADDRESS = "0xDe210B21D65eD85D61A107b1d82c891bb2Fe9ae6"; // Local Ganache address
const MONEY_BACK_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Local Ganache address

// Contract ABIs (import these from your compiled contracts)
const TERM_LIFE_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_sumAssured",
                "type": "uint256"
            }
        ],
        "name": "createPolicy",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "policyCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_policyId",
                "type": "uint256"
            }
        ],
        "name": "payPremium",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_policyId",
                "type": "uint256"
            }
        ],
        "name": "submitClaim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_policyId",
                "type": "uint256"
            }
        ],
        "name": "getPolicy",
        "outputs": [
            {
                "internalType": "address",
                "name": "policyholder",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "sumAssured",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "premium",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "startDate",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "endDate",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "isActive",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "isClaimed",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "lastPremiumPaid",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
const MONEY_BACK_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_sumAssured",
                "type": "uint256"
            }
        ],
        "name": "createPolicy",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_policyId",
                "type": "uint256"
            }
        ],
        "name": "payPremium",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_policyId",
                "type": "uint256"
            }
        ],
        "name": "submitClaim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Initialize Web3 and contracts
async function initializeWeb3() {
    // Check if ethers is available
    if (typeof ethers === 'undefined') {
        throw new Error('ethers.js not loaded. Please refresh the page.');
    }

    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Add network if not present
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [NETWORK_CONFIG],
                });
            } catch (error) {
                // Network already exists
                console.log('Network already configured');
            }

            // Switch to the correct network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: NETWORK_CONFIG.chainId }],
            });

            if (accounts.length > 0) {
                userAddress = accounts[0];
                userWallet = new ethers.providers.Web3Provider(window.ethereum);
                
                // Initialize contracts
                contracts = {
                    termLifeContract: new ethers.Contract(
                        TERM_LIFE_CONTRACT_ADDRESS,
                        TERM_LIFE_ABI,
                        userWallet.getSigner()
                    ),
                    moneyBackContract: new ethers.Contract(
                        MONEY_BACK_CONTRACT_ADDRESS,
                        MONEY_BACK_ABI,
                        userWallet.getSigner()
                    )
                };
                
                // Store wallet address in localStorage
                localStorage.setItem('walletAddress', userAddress);
                
                updateWalletUI();
                return contracts;
            }
        } catch (error) {
            console.error('Error initializing Web3:', error);
            throw error;
        }
    } else {
        alert('Please install MetaMask to use this feature!');
        return null;
    }
}

// Update UI based on wallet connection
function updateWalletUI() {
    const walletBtn = document.getElementById('walletBtn');
    const walletAddress = document.getElementById('walletAddress');
    const walletStatus = document.getElementById('walletStatus');
    
    if (walletBtn && walletAddress && walletStatus) {
        if (userAddress) {
            walletBtn.classList.add('connected');
            walletBtn.innerHTML = `
                <svg class="wallet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Disconnect
            `;
            walletAddress.textContent = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
            walletAddress.style.display = 'inline-block';
            walletStatus.textContent = 'Connected';
            walletStatus.style.color = '#4CAF50';
        } else {
            walletBtn.classList.remove('connected');
            walletBtn.innerHTML = `
                <svg class="wallet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Connect Wallet
            `;
            walletAddress.style.display = 'none';
            walletStatus.textContent = 'Not Connected';
            walletStatus.style.color = '#666';
        }
    }
}

// Handle wallet connection
async function connectWallet() {
    const walletBtn = document.getElementById('walletBtn');
    if (!walletBtn) {
        console.error('Wallet button not found');
        return;
    }
    
    try {
        // Add loading state
        walletBtn.classList.add('loading');
        walletBtn.innerHTML = `
            <svg class="wallet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Connecting...
        `;
        
        await initializeWeb3();
        
        // Remove loading state
        walletBtn.classList.remove('loading');
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Error connecting wallet. Please try again.');
        // Reset button state
        if (walletBtn) {
            walletBtn.classList.remove('loading');
            walletBtn.innerHTML = `
                <svg class="wallet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Connect Wallet
            `;
        }
    }
}

// Handle wallet disconnection
async function disconnectWallet() {
    try {
        // Clear contract instances
        contracts = null;
        
        // Clear wallet provider
        userWallet = null;
        
        // Clear user address
        userAddress = null;
        
        // Clear any stored wallet data
        localStorage.removeItem('walletAddress');
        
        // Update UI
        updateWalletUI();
        
        // Show success message
        alert('Wallet disconnected successfully!');
    } catch (error) {
        console.error('Error disconnecting wallet:', error);
        alert('Error disconnecting wallet. Please try again.');
    }
}

// Check if wallet is connected
function isWalletConnected() {
    return userWallet !== null && userAddress !== null;
}

// Create Term Life Insurance Policy
async function createTermLifePolicy() {
    try {
        if (!window.ethereum || !window.ethereum.selectedAddress) {
            alert('Please connect your wallet first');
            return;
        }

        // Check KYC status
        const kycData = JSON.parse(localStorage.getItem('kycData') || '[]');
        const userKYC = kycData.find(k => k.walletAddress === window.ethereum.selectedAddress);
        
        if (!userKYC) {
            alert('Please complete your KYC verification before creating a policy');
            window.location.href = 'kyc.html';
            return;
        }

        if (userKYC.status !== 'verified') {
            alert('Your KYC verification is not approved yet. Please wait for approval.');
            return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(TERM_LIFE_CONTRACT_ADDRESS, TERM_LIFE_ABI, signer);

        // Fixed values for Term Life Insurance
        const sumAssuredWei = ethers.utils.parseEther('1.0'); // 1 ETH = ₹1 Cr
        const premiumWei = ethers.utils.parseEther('0.499'); // ₹499 in ETH

        // Create policy transaction with only sumAssured parameter
        const tx = await contract.createPolicy(sumAssuredWei, {
            value: premiumWei
        });

        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log('Transaction receipt:', receipt);

        // Generate a unique policy ID
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000);
        const policyId = `${timestamp}${randomNum}`;
        console.log('Created policy ID:', policyId);

        // Get current date and calculate end date
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1); // 1 year term

        // Create policy object with all required fields
        const policyData = {
            id: policyId,
            type: 'term',
            sumAssured: '1.0',
            premium: '0.499',
            term: '1',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            lastPremiumPaid: startDate.toISOString(),
            isActive: true,
            isClaimed: false,
            policyholder: window.ethereum.selectedAddress,
            contractAddress: TERM_LIFE_CONTRACT_ADDRESS,
            activationTime: startDate.toISOString(),
            premiumHistory: [{
                date: startDate.toISOString(),
                amount: '0.499',
                status: 'paid',
                transactionHash: receipt.transactionHash
            }]
        };

        // Add policy to localStorage
        const userPolicies = JSON.parse(localStorage.getItem('userPolicies') || '[]');
        userPolicies.push(policyData);
        localStorage.setItem('userPolicies', JSON.stringify(userPolicies));

        // Show success message
        alert('Term Life Policy created successfully! Your policy will be active immediately.');
        
        // Redirect to dashboard
        window.location.href = '/dashboard.html';
    } catch (error) {
        console.error('Error creating policy:', error);
        alert('Error creating policy: ' + error.message);
    }
}

// Create Money-Back Policy
async function createMoneyBackPolicy() {
    try {
        if (!window.ethereum || !window.ethereum.selectedAddress) {
            alert('Please connect your wallet first');
            return;
        }

        // Check KYC status
        const kycData = JSON.parse(localStorage.getItem('kycData') || '[]');
        const userKYC = kycData.find(k => k.walletAddress === window.ethereum.selectedAddress);
        
        if (!userKYC) {
            alert('Please complete your KYC verification before creating a policy');
            window.location.href = 'kyc.html';
            return;
        }

        if (userKYC.status !== 'verified') {
            alert('Your KYC verification is not approved yet. Please wait for approval.');
            return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(MONEY_BACK_CONTRACT_ADDRESS, MONEY_BACK_ABI, signer);

        // Fixed values for Money-Back Insurance
        const sumAssuredWei = ethers.utils.parseEther('0.15'); // 0.15 ETH = ₹15 Lakhs
        const monthlyPremiumWei = ethers.utils.parseEther('1.499'); // ₹1,499 per month

        // Create policy transaction with only sumAssured parameter
        const tx = await contract.createPolicy(sumAssuredWei, {
            value: monthlyPremiumWei
        });

        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log('Transaction receipt:', receipt);

        // Generate a unique policy ID
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000);
        const policyId = `${timestamp}${randomNum}`;
        console.log('Created policy ID:', policyId);

        // Get current date and calculate end date
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 20); // 20 years term

        // Create policy object with all required fields
        const policyData = {
            id: policyId,
            type: 'moneyback',
            sumAssured: '0.15',
            premium: '1.499', // Monthly premium
            term: '20',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            lastPremiumPaid: startDate.toISOString(),
            isActive: true,
            isClaimed: false,
            policyholder: window.ethereum.selectedAddress,
            contractAddress: MONEY_BACK_CONTRACT_ADDRESS,
            activationTime: startDate.toISOString(),
            premiumHistory: [{
                date: startDate.toISOString(),
                amount: '1.499',
                status: 'paid',
                transactionHash: receipt.transactionHash
            }]
        };

        // Add policy to localStorage
        const userPolicies = JSON.parse(localStorage.getItem('userPolicies') || '[]');
        userPolicies.push(policyData);
        localStorage.setItem('userPolicies', JSON.stringify(userPolicies));

        // Show success message
        alert('Money-Back Policy created successfully! Your policy will be active immediately.');
        
        // Redirect to dashboard
        window.location.href = '/dashboard.html';
    } catch (error) {
        console.error('Error creating policy:', error);
        alert('Error creating policy: ' + error.message);
    }
}

// Function to pay premium
async function payPremium(policyType) {
    try {
        if (!window.ethereum || !window.ethereum.selectedAddress) {
            alert('Please connect your wallet first');
            return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // Get the appropriate contract based on policy type
        const contract = policyType === 'term' 
            ? new ethers.Contract(TERM_LIFE_CONTRACT_ADDRESS, TERM_LIFE_ABI, signer)
            : new ethers.Contract(MONEY_BACK_CONTRACT_ADDRESS, MONEY_BACK_ABI, signer);

        // Get premium amount in ETH
        const premiumAmount = policyType === 'term' 
            ? ethers.utils.parseEther('0.499') // ₹499 yearly
            : ethers.utils.parseEther('1.499'); // ₹1,499 monthly

        // Get user's policies
        const userPolicies = JSON.parse(localStorage.getItem('userPolicies') || '[]');
        const userPoliciesOfType = userPolicies.filter(p => p.type === policyType);

        if (userPoliciesOfType.length === 0) {
            alert('You need to create a policy first before paying premium');
            return;
        }

        // Get the most recent policy
        const latestPolicy = userPoliciesOfType[userPoliciesOfType.length - 1];

        // Pay premium
        const tx = await contract.payPremium(latestPolicy.id, {
            value: premiumAmount
        });

        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log('Premium payment transaction:', receipt);

        // Update last premium paid date
        const currentDate = new Date();
        latestPolicy.lastPremiumPaid = currentDate.toISOString();

        // Initialize premium history if it doesn't exist
        if (!latestPolicy.premiumHistory) {
            latestPolicy.premiumHistory = [];
        }

        // Add new premium payment to history
        const newPayment = {
            date: currentDate.toISOString(),
            amount: policyType === 'term' ? '0.499' : '1.499',
            status: 'paid',
            transactionHash: receipt.transactionHash
        };

        latestPolicy.premiumHistory.push(newPayment);
        console.log('Updated premium history:', latestPolicy.premiumHistory);

        // Update the policy in the userPolicies array
        const policyIndex = userPolicies.findIndex(p => p.id === latestPolicy.id);
        if (policyIndex !== -1) {
            userPolicies[policyIndex] = latestPolicy;
        }

        // Save updated policies to localStorage
        localStorage.setItem('userPolicies', JSON.stringify(userPolicies));
        console.log('Saved policies to localStorage:', userPolicies);

        // Show success message
        alert('Premium paid successfully!');
        
        // Reload policies to show updated information
        if (typeof loadPolicies === 'function') {
            loadPolicies();
        } else {
            window.location.reload();
        }
    } catch (error) {
        console.error('Error paying premium:', error);
        alert('Error paying premium: ' + error.message);
    }
}

// Submit Claim
async function submitClaim(policyId, contractType) {
    try {
        if (!contracts) {
            await initializeWeb3();
        }
        if (!contracts) return;

        const contract = contractType === 'term' ? contracts.termLifeContract : contracts.moneyBackContract;
        const tx = await contract.submitClaim(policyId);
        
        await tx.wait();
        alert('Claim submitted successfully!');
    } catch (error) {
        console.error('Error submitting claim:', error);
        alert('Failed to submit claim. Please try again.');
    }
}

// Check if MetaMask is installed
function checkMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        return true;
    }
    return false;
}

// Listen for account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', function (accounts) {
        if (accounts.length === 0) {
            // User disconnected their wallet
            disconnectWallet();
        } else {
            userAddress = accounts[0];
            updateWalletUI();
        }
    });

    window.ethereum.on('chainChanged', function (chainId) {
        window.location.reload();
    });

    window.ethereum.on('disconnect', function () {
        disconnectWallet();
    });
}

// Export functions for use in other files
window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;
window.createTermLifePolicy = createTermLifePolicy;
window.createMoneyBackPolicy = createMoneyBackPolicy;
window.payPremium = payPremium;
window.submitClaim = submitClaim;
window.checkMetaMask = checkMetaMask;
window.isWalletConnected = isWalletConnected; 