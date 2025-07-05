// Authentication state
let currentUser = null;

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

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', () => {
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
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
                    // Close the login modal
                    const loginModal = document.getElementById('loginModal');
                    if (loginModal) {
                        loginModal.classList.remove('active');
                        document.body.classList.remove('modal-open');
                    }
                } else {
                    alert(data.message || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed. Please try again.');
            }
        });
    }

    // Signup form handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
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
    }
});

// Update UI for logged-in user
function updateUIForLoggedInUser() {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        if (currentUser) {
            // Create a container for the user info and logout button
            const container = document.createElement('div');
            container.className = 'user-container';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.gap = '10px';

            // Create welcome text
            const welcomeText = document.createElement('span');
            welcomeText.textContent = `Welcome, ${currentUser.fullName}`;
            welcomeText.style.marginRight = '10px';

            // Create logout button
            const logoutBtn = document.createElement('button');
            logoutBtn.textContent = 'Logout';
            logoutBtn.className = 'logout-btn';
            logoutBtn.style.padding = '5px 10px';
            logoutBtn.style.backgroundColor = '#ff4444';
            logoutBtn.style.color = 'white';
            logoutBtn.style.border = 'none';
            logoutBtn.style.borderRadius = '4px';
            logoutBtn.style.cursor = 'pointer';
            logoutBtn.onclick = logout;

            // Add elements to container
            container.appendChild(welcomeText);
            container.appendChild(logoutBtn);

            // Replace login button with container
            loginBtn.parentNode.replaceChild(container, loginBtn);

            // Close the login modal if it's open
            const loginModal = document.getElementById('loginModal');
            if (loginModal && loginModal.classList.contains('active')) {
                toggleLoginModal();
            }
        } else {
            // If not logged in, show login button
            if (!loginBtn.classList.contains('login-btn')) {
                const newLoginBtn = document.createElement('button');
                newLoginBtn.className = 'login-btn';
                newLoginBtn.textContent = 'Login';
                newLoginBtn.onclick = toggleLoginModal;
                loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
            } else {
                loginBtn.textContent = 'Login';
                loginBtn.onclick = toggleLoginModal;
            }
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    updateUIForLoggedInUser();
    // Show login modal after logout
    toggleLoginModal();
    // Refresh the page after a short delay
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

// Modal toggles
function toggleLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.toggle('active');
        document.body.classList.toggle('modal-open');
    }
}

function toggleSignupModal() {
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    
    if (loginModal && loginModal.classList.contains('active')) {
        loginModal.classList.remove('active');
    }
    
    if (signupModal) {
        signupModal.classList.toggle('active');
        document.body.classList.toggle('modal-open');
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    
    if (loginModal && event.target === loginModal) {
        toggleLoginModal();
    }
    if (signupModal && event.target === signupModal) {
        toggleSignupModal();
    }
}; 