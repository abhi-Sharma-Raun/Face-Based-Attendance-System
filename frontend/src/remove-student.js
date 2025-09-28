document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Guard ---
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL; // Your backend URL
    const deleteStudentEndpoint = import.meta.env.VITE_DELETE_STUDENT;

    // Get elements
    const deleteForm = document.getElementById('delete-form');
    const rollNoInput = document.getElementById('roll-no-input');
    const deleteButton = document.getElementById('delete-button');
    const responseMessage = document.getElementById('response-message');

    // Modal elements
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    let rollNoToDelete = '';

    
    deleteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        rollNoToDelete = rollNoInput.value.trim();
        responseMessage.textContent = '';

        if (rollNoToDelete === '') {
            responseMessage.textContent = 'Please enter a roll number.';
            responseMessage.className = 'message-area error';
            return;
        }
        
        // Show the modal
        confirmationModal.style.display = 'flex';
    });

    
    cancelDeleteBtn.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
        rollNoToDelete = ''; // Clear the stored roll number
    });

    // 3. Handle the final "Confirm" button to send the API request
    confirmDeleteBtn.addEventListener('click', async () => {
        confirmationModal.style.display = 'none'; // Hide modal first
        deleteButton.disabled = true;
        deleteButton.textContent = 'DELETING...';

        try {
            const response = await fetch(`${API_BASE_URL}${deleteStudentEndpoint}/${rollNoToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: "An unknown error occurred." }));
                throw new Error(errorData.detail || "Failed to delete student.");
            }

            const result = await response.json();
            responseMessage.textContent = result.msg || "Student deleted successfully!";
            responseMessage.className = 'message-area success';
            rollNoInput.value = ''; // Clear input on success

        } catch (error) {
            console.error('Error deleting student:', error);
            responseMessage.textContent = `Error: ${error.message}`;
            responseMessage.className = 'message-area error';
        } finally {
            deleteButton.disabled = false;
            deleteButton.textContent = 'Delete';
            rollNoToDelete = ''; // Clear the stored roll number
        }
    });
});
