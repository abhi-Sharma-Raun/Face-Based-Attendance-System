document.addEventListener('DOMContentLoaded', () => {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const registerForm = document.getElementById('registerForm');
    const registerButton = registerForm.querySelector('.login-button');

    
    const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
    const accountCreationEndpoint = import.meta.env.VITE_CREATE_ACCOUNT;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userId = document.getElementById('userId').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (userId.trim() === '' || email.trim() === '' || password.trim() === '') {
            alert('Please fill in all fields.');
            return;
        }

        registerButton.textContent = 'REGISTERING...';
        registerButton.disabled = true;

        try {
            
            const response = await fetch(`${API_BASE_URL}${accountCreationEndpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    email: email,
                    password: password
                }),
            });

            if (!response.ok) {
                const result = await response.json();
            
                throw new Error(result.detail || 'Registration failed.');
            }
            
            // Transition to success step
            step1.classList.remove('active');
            step2.classList.add('active');

        } catch (error) {
            console.error('Registration Error:', error);
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                alert('Could not connect to the server. Please check your connection and the API URL.');
            } else {
                // This will now display the error from your backend (e.g., "Email not verified").
                alert(`An error occurred: ${error.message}`);
            }
        } finally {
            registerButton.textContent = 'REGISTER';
            registerButton.disabled = false;
        }
    });
});

