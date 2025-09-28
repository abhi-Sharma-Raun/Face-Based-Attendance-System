document.addEventListener('DOMContentLoaded', () => {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');

    const sendOtpForm = document.getElementById('sendOtpForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    
    const getOtpButton = sendOtpForm.querySelector('.login-button');
    const changePasswordButton = resetPasswordForm.querySelector('.login-button');

    let userEmail = ''; // To store the email between steps

    const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
    const forgotPasswordSendOtpEndpoint = import.meta.env.VITE_FORGOT_PASSWORD_OTP
    const forgotPasswordVerifyOtpEndpoint = import.meta.env.VITE_FORGOT_PASSWORD_VERIFY_OTP_RESET_PAASSWORD

    // Step 1: Handle the "GET OTP" form submission
    sendOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        userEmail = document.getElementById('forgotEmail').value;

        if (!validateEmail(userEmail)) {
            alert('Please enter a valid email address.');
            return;
        }

        getOtpButton.textContent = 'SENDING...';
        getOtpButton.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}${forgotPasswordSendOtpEndpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to send OTP.');

            alert(result.message || 'OTP has been sent to your email.');

            // Transition to the next step
            document.getElementById('userEmailDisplay').textContent = userEmail;
            document.getElementById('verifyEmail').value = userEmail; // Pre-fill email in the next form
            step1.classList.remove('active');
            step2.classList.add('active');

        } catch (error) {
            console.error('Fetch Error:', error);
            // Provide a more user-friendly message for common network errors
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                alert('Could not connect to the server. Please make sure your backend is running and the API_BASE_URL is correct.');
            } else {
                alert(`An error occurred: ${error.message}`);
            }
        } finally {
            getOtpButton.textContent = 'GET OTP';
            getOtpButton.disabled = false;
        }
    });

    // Step 2: Handle the "CHANGE PASSWORD" form submission
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const otp = document.getElementById('otp').value;
        const newPassword = document.getElementById('newPassword').value;

        if (otp.trim().length !== 6 || newPassword.trim() === '') {
            alert('Please fill in the OTP and your new password.');
            return;
        }

        changePasswordButton.textContent = 'CHANGING...';
        changePasswordButton.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}${forgotPasswordVerifyOtpEndpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    otp: otp,
                    new_password: newPassword,
                }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to change password.');
            
            // Transition to success step
            step2.classList.remove('active');
            step3.classList.add('active');

        } catch (error) {
            console.error('Fetch Error:', error);
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                alert('Could not connect to the server. Please make sure your backend is running and the API_BASE_URL is correct.');
            } else {
                alert(`An error occurred: ${error.message}`);
            }
        } finally {
            changePasswordButton.textContent = 'CHANGE PASSWORD';
            changePasswordButton.disabled = false;
        }
    });

    function validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
});

