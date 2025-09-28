document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');
    const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL; // Set your backend URL
    const logoutEndpoint = import.meta.env.VITE_LOGOUT

    //--- Authentication Guard ---
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = 'login.html';
        return; // Stop the script
    }                 
    // --- END ---

    // --- Logout Logic with Token ---
    logoutButton.addEventListener('click', async () => {
        logoutButton.textContent = 'LOGGING OUT...';
        logoutButton.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}${logoutEndpoint}`, {
                method: 'POST', 
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const result = await response.json().catch(() => null);
                console.error('Server logout failed:', result?.msg || 'Unknown error');
                // Even if the server fails, we'll log out on the client side
            }

        } catch (error) {
            console.error('Logout request failed:', error);
            alert('Could not contact the server, logging out locally.');
        } finally {
            
            localStorage.removeItem('accessToken');
            window.location.href = 'login.html';
        }
    });
    // --- END ---
});

