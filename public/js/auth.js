// Global auth state
let currentUser = null;

// Function to check if user is authenticated
async function checkAuthStatus() {
    try {
        const token = localStorage.getItem('token');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userWallet = localStorage.getItem('walletAddress');
        
        if (!token && !isLoggedIn) {
            currentUser = null;
            return {
                isLoggedIn: false,
                walletAddress: null
            };
        }

        // If we have a token, verify with the server
        if (token) {
            const response = await fetch('/api/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.valid) {
                currentUser = data.user;
                return {
                    isLoggedIn: true,
                    walletAddress: userWallet
                };
            }
        }

        // If we're logged in via localStorage
        if (isLoggedIn) {
            return {
                isLoggedIn: true,
                walletAddress: userWallet
            };
        }

        // If neither condition is met
        currentUser = null;
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        return {
            isLoggedIn: false,
            walletAddress: null
        };
    } catch (error) {
        console.error('Auth check error:', error);
        currentUser = null;
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        return {
            isLoggedIn: false,
            walletAddress: null
        };
    }
}

// Function to get current user
function getCurrentUser() {
    return currentUser;
}

// Function to handle logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('kycVerified');
    localStorage.removeItem('kycWalletAddress');
    localStorage.removeItem('isLoggedIn');
    currentUser = null;
    window.location.href = '/';
}

// Function to update UI for logged in user
function updateUIForLoggedInUser() {
    const loginButton = document.getElementById('loginButton');
    const signupButton = document.getElementById('signupButton');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    if (loginButton) loginButton.style.display = 'none';
    if (signupButton) signupButton.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userName && currentUser) userName.textContent = currentUser.full_name;
}

// Function to update UI for logged out user
function updateUIForLoggedOutUser() {
    const loginButton = document.getElementById('loginButton');
    const signupButton = document.getElementById('signupButton');
    const userMenu = document.getElementById('userMenu');
    
    if (loginButton) loginButton.style.display = 'block';
    if (signupButton) signupButton.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
}

// Initialize auth state when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    const authStatus = await checkAuthStatus();
    if (authStatus.isLoggedIn) {
        updateUIForLoggedInUser();
    } else {
        updateUIForLoggedOutUser();
    }
}); 