// Authentication state
let currentUser = null;
let userWallet = null;
let userAddress = null;

// Check if user is logged in
const token = localStorage.getItem('token');
if (token) {
    // Verify token with backend
    fetch('/api/verify', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.valid) {
            currentUser = data.user;
            updateUIForLoggedInUser();
        }
    })
    .catch(console.error);
}

// Initialize Web3 if MetaMask is available
if (typeof window.ethereum !== 'undefined') {
    initializeWeb3();
}

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateUIForLoggedInUser();
            toggleLoginModal();
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

// Signup form handler
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    console.log('Attempting to sign up with:', { fullName, email, password: '[REDACTED]' });
    
    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fullName, email, password })
        });
        
        const data = await response.json();
        console.log('Signup response:', { ...data, token: data.token ? '[REDACTED]' : null });
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            updateUIForLoggedInUser();
            toggleSignupModal();
            alert('Signup successful! Welcome to InsurEdge.');
        } else {
            console.error('Signup failed:', data);
            alert(data.message || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed. Please try again.');
    }
});

// Update UI for logged-in user
function updateUIForLoggedInUser() {
    const loginBtn = document.querySelector('.login-btn');
    if (currentUser) {
        loginBtn.textContent = `Welcome, ${currentUser.fullName}`;
        loginBtn.onclick = logout;
        // Close the login modal if it's open
        const loginModal = document.getElementById('loginModal');
        if (loginModal.classList.contains('active')) {
            toggleLoginModal();
        }
    } else {
        loginBtn.textContent = 'Login';
        loginBtn.onclick = toggleLoginModal;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateUIForLoggedInUser();
    // Show login modal after logout
    toggleLoginModal();
}

// Modal toggles
function toggleLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.toggle('active');
    document.body.classList.toggle('modal-open');
}

function toggleSignupModal() {
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    
    if (loginModal.classList.contains('active')) {
        loginModal.classList.remove('active');
    }
    
    signupModal.classList.toggle('active');
    document.body.classList.toggle('modal-open');
}

// Close modals when clicking outside
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    
    if (event.target === loginModal) {
        toggleLoginModal();
    }
    if (event.target === signupModal) {
        toggleSignupModal();
    }
};

// Initialize Web3
async function initializeWeb3() {
    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAddress = accounts[0];
        userWallet = new ethers.providers.Web3Provider(window.ethereum);
        
        // Update UI
        updateWalletUI();
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', function (accounts) {
            userAddress = accounts[0];
            updateWalletUI();
        });

        // Listen for chain changes
        window.ethereum.on('chainChanged', function (chainId) {
            window.location.reload();
        });
    } catch (error) {
        console.error('User denied account access:', error);
    }
}

// Update wallet UI
function updateWalletUI() {
    const walletBtn = document.getElementById('walletBtn');
    const walletAddress = document.getElementById('walletAddress');
    
    if (walletBtn && walletAddress) {
        if (userAddress) {
            walletBtn.textContent = 'Connected';
            walletBtn.classList.add('connected');
            walletAddress.textContent = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
            walletAddress.style.display = 'block';
        } else {
            walletBtn.textContent = 'Connect Wallet';
            walletBtn.classList.remove('connected');
            walletAddress.style.display = 'none';
        }
    }
}

// Connect wallet
async function connectWallet() {
    if (!userWallet) {
        await initializeWeb3();
    }
}

// Disconnect wallet
function disconnectWallet() {
    userWallet = null;
    userAddress = null;
    updateWalletUI();
}

// Export functions for use in other files
window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;