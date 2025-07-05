// Function to submit KYC
async function submitKYC(formData) {
    try {
        console.log('=== Starting KYC Submission ===');
        
        const token = localStorage.getItem('token');
        console.log('Token present:', !!token);
        
        if (!token) {
            throw new Error('User not authenticated');
        }

        // Check if wallet is connected
        const walletAddress = localStorage.getItem('walletAddress');
        console.log('Wallet address:', walletAddress);
        
        if (!walletAddress) {
            throw new Error('Please connect your wallet first');
        }

        // Log form data for debugging
        console.log('Form data contents:');
        for (let [key, value] of formData.entries()) {
            if (key.includes('Card')) {
                console.log(key, 'File present:', !!value);
            } else {
                console.log(key, value);
            }
        }

        // Add wallet address to form data
        formData.append('walletAddress', walletAddress);

        // Add user data to formData
        const user = JSON.parse(localStorage.getItem('user'));
        console.log('User data from localStorage:', user);
        
        if (user) {
            formData.append('email', user.email);
            console.log('Added user email to form data:', user.email);
        }

        console.log('Submitting KYC request with headers:', {
            'Authorization': `Bearer ${token.substring(0, 10)}...`
        });
        
        const response = await fetch('/api/kyc/submit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        const responseData = await response.json();
        console.log('Response data:', responseData);

        if (!response.ok) {
            console.error('KYC submission failed:', responseData);
            throw new Error(responseData.message || 'Failed to submit KYC');
        }

        // Store KYC status in localStorage
        localStorage.setItem('kycVerified', 'true');
        localStorage.setItem('kycWalletAddress', walletAddress);
        console.log('KYC status stored in localStorage');
        
        // Show success message
        alert('KYC submitted successfully! Your information has been stored. Check the console for details.');
        
        // Update the UI to show success
        const kycForm = document.getElementById('kycForm');
        const successMessage = document.createElement('div');
        successMessage.className = 'alert alert-success';
        successMessage.innerHTML = `
            <h4>KYC Submitted Successfully!</h4>
            <p>Your information has been stored and is pending verification.</p>
            <p>You can check the browser console (F12) for detailed submission logs.</p>
            <p>You will be notified once your KYC is verified.</p>
        `;
        kycForm.parentNode.insertBefore(successMessage, kycForm);
        kycForm.style.display = 'none';

        // Update KYC status display if it exists
        const kycStatusElement = document.getElementById('kycStatus');
        if (kycStatusElement) {
            kycStatusElement.textContent = 'Pending';
            kycStatusElement.className = 'status pending';
        }
        
        return responseData;
    } catch (error) {
        console.error('=== KYC Submission Error ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);
        alert(error.message || 'Failed to submit KYC. Please try again.');
        throw error;
    }
}

// Function to check KYC status
async function checkKYCStatus() {
    try {
        const walletAddress = localStorage.getItem('walletAddress');
        if (!walletAddress) {
            console.log('No wallet address found');
            return null;
        }

        const kycDataStr = localStorage.getItem('kycData');
        if (!kycDataStr) {
            console.log('No KYC data found');
            return null;
        }

        try {
            const kycData = JSON.parse(kycDataStr);
            if (!Array.isArray(kycData)) {
                console.log('KYC data is not an array');
                return null;
            }

            const userKYC = kycData.find(kyc => kyc.walletAddress === walletAddress);
            return userKYC ? userKYC.status : null;
        } catch (parseError) {
            console.error('Error parsing KYC data:', parseError);
            return null;
        }
    } catch (error) {
        console.error('Error checking KYC status:', error);
        return null;
    }
}

// Function to get user's KYC details
async function getMyKYC() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Please login to view KYC details');
        }

        const response = await fetch('/api/kyc/my-kyc', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        const kyc = await response.json();
        return kyc;
    } catch (error) {
        console.error('Error fetching KYC details:', error);
        throw error;
    }
}

// Function to update KYC status (admin only)
async function updateKYCStatus(kycId, status, rejectionReason = '') {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('User not authenticated');
        }

        const response = await fetch(`/api/kyc/update-status/${kycId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, rejectionReason })
        });

        if (!response.ok) {
            throw new Error('Failed to update KYC status');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating KYC status:', error);
        throw error;
    }
}

// Function to get all KYC submissions (admin only)
async function getAllKYCSubmissions() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('User not authenticated');
        }

        const response = await fetch('/api/kyc/all', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch KYC submissions');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching KYC submissions:', error);
        throw error;
    }
}

// Function to update KYC UI elements
async function updateKYCUI(status) {
    try {
        const kycBadge = document.querySelector('.kyc-verified-badge');
        const kycBanner = document.querySelector('.kyc-banner');
        
        // If elements don't exist, return silently
        if (!kycBadge) {
            console.log('KYC badge element not found');
            return;
        }

        // Update badge based on status
        if (status === 'verified') {
            kycBadge.classList.remove('hidden');
        } else {
            kycBadge.classList.add('hidden');
        }

        // Update banner if it exists
        if (kycBanner) {
            if (status === 'pending') {
                kycBanner.innerHTML = `
                    <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                        <p class="font-bold">KYC Verification Pending</p>
                        <p>Your KYC verification is under review. You'll be notified once it's approved.</p>
                    </div>`;
            } else if (status === 'rejected') {
                kycBanner.innerHTML = `
                    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                        <p class="font-bold">KYC Verification Rejected</p>
                        <p>Your KYC verification was rejected. Please submit your documents again.</p>
                    </div>`;
            } else {
                kycBanner.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Error updating KYC UI:', error);
    }
}

// Function to handle KYC form submission
document.addEventListener('DOMContentLoaded', function() {
    const kycForm = document.getElementById('kycForm');
    if (kycForm) {
        kycForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('=== KYC Form Submission Started ===');

            try {
                // Get form data
                const formData = new FormData(this);
                
                // Log all form fields
                console.log('Form fields:');
                for (let [key, value] of formData.entries()) {
                    if (key.includes('Card')) {
                        console.log(`${key}: [File] ${value.name}`);
                    } else {
                        console.log(`${key}: ${value}`);
                    }
                }

                // Validate files
                const panCard = document.getElementById('panCard').files[0];
                const aadhaarCard = document.getElementById('aadhaarCard').files[0];
                
                if (!panCard) throw new Error('PAN Card file is required');
                if (!aadhaarCard) throw new Error('Aadhaar Card file is required');
                
                console.log('Files selected:', {
                    panCard: { name: panCard.name, type: panCard.type, size: panCard.size },
                    aadhaarCard: { name: aadhaarCard.name, type: aadhaarCard.type, size: aadhaarCard.size }
                });

                // Submit KYC using the main function
                await submitKYC(formData);

            } catch (error) {
                console.error('=== KYC Submission Error ===');
                console.error('Error:', error);
                alert(error.message || 'Failed to submit KYC. Please try again.');
            }
        });
    }
});

// Check KYC status on page load
window.addEventListener('load', async function() {
    const kycStatus = await checkKYCStatus();
    await updateKYCUI(kycStatus);
});

// Export functions to window object
window.submitKYC = submitKYC;
window.checkKYCStatus = checkKYCStatus;
window.getMyKYC = getMyKYC;
window.updateKYCStatus = updateKYCStatus;
window.getAllKYCSubmissions = getAllKYCSubmissions; 