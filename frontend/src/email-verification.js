document.addEventListener('DOMContentLoaded', () => {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');

    const sendOtpForm = document.getElementById('sendOtpForm');
    const verifyOtpForm = document.getElementById('verifyOtpForm');
    
    const getOtpButton = sendOtpForm.querySelector('.login-button');
    const verifyButton = verifyOtpForm.querySelector('.login-button');

    let userEmail = ''; // To store the email between steps

    const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
    const emailVerificationSendOtpURL = import.meta.env.VITE_SEND_VERIFICATION_EMAIL;
    const emailVerificationVerifyOtpURL = import.meta.env.VITE_VERIFY_EMAIL;

    // Step 1: Handle the "GET OTP" form submission
    sendOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        userEmail = document.getElementById('verificationEmail').value;

        if (!validateEmail(userEmail)) {
            alert('Please enter a valid email address.');
            return;
        }

        getOtpButton.textContent = 'SENDING...';
        getOtpButton.disabled = true;

        try {
            
            const response = await fetch(`${API_BASE_URL}${emailVerificationSendOtpURL}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.detail || 'Failed to send OTP.');
            }

            alert('OTP has been sent to your email.');

            // Transition to the next step
            document.getElementById('userEmailDisplay').textContent = userEmail;
            step1.classList.remove('active');
            step2.classList.add('active');

        } catch (error) {
            console.error('Error sending OTP:', error);
             if (error instanceof TypeError && error.message === 'Failed to fetch') {
                alert('Could not connect to the server. Please check your connection and the API URL.');
            } else {
                alert(`An error occurred: ${error.message}`);
            }
        } finally {
            getOtpButton.textContent = 'GET OTP';
            getOtpButton.disabled = false;
        }
    });

    // Step 2: Handle the "VERIFY EMAIL" form submission
    verifyOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const otp = document.getElementById('otp').value;

        if (otp.trim().length !== 6) {
            alert('Please enter the 6-digit OTP.');
            return;
        }

        verifyButton.textContent = 'VERIFYING...';
        verifyButton.disabled = true;

        try {
            
            const response = await fetch(`${API_BASE_URL}${emailVerificationVerifyOtpURL}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    otp: otp,
                }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'OTP verification failed.');
            }
            
            // Transition to success step
            step2.classList.remove('active');
            step3.classList.add('active');

        } catch (error) {
            console.error('Error verifying OTP:', error);
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                alert('Could not connect to the server. Please check your connection and the API URL.');
            } else {
                alert(`An error occurred: ${error.message}`);
            }
        } finally {
            verifyButton.textContent = 'VERIFY EMAIL';
            verifyButton.disabled = false;
        }
    });

    function validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
});
