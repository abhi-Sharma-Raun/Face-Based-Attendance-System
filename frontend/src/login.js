document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const loginButton = loginForm.querySelector('.login-button');

    const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL; // Set your backend URL
    const loginEndpoint = import.meta.env.VITE_LOGIN; // Set your login endpoint

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (email.trim() === '' || password.trim() === '') {
            alert('Please fill in both email and password.');
            return;
        }

        loginButton.textContent = 'LOGGING IN...';
        loginButton.disabled = true;

        try {
            
            const response = await fetch(`${API_BASE_URL}${loginEndpoint}`, {
                method: 'POST',
                headers: {                    
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                }),
            });

            if (!response.ok) {
                const result = await response.json().catch(() => null);
                throw new Error(result?.detail || 'Login failed. Please check your credentials.');
            }

            const result = await response.json();

            if (result.access_token) {
                localStorage.setItem('accessToken', result.access_token);
                window.location.href = 'dashboard.html';
            } else {
                throw new Error('Login successful, but no token was received from the server.');
            }

        } catch (error) {
            console.error('Login Error:', error);
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                alert('Could not connect to the server. Please check your connection and the API URL.');
            } else {
                alert(`An error occurred: ${error.message}`);
            }
        } finally {
            loginButton.textContent = 'LOGIN';
            loginButton.disabled = false;
        }
    });
});