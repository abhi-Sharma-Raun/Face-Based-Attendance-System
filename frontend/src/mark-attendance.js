document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Guard ---
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL; // Your backend URL
    const attendanceEndpoint = import.meta.env.VITE_MARK_ATTENDANCE;

    // Get page elements
    const attendanceForm = document.getElementById('attendance-form');
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const previewContainer = document.getElementById('image-preview-container');
    const previewText = document.getElementById('preview-text');
    const submitButton = document.getElementById('submit-button');
    const responseMessage = document.getElementById('response-message');

    let selectedFile = null;

    // Handle file selection
    imageUpload.addEventListener('change', (event) => {
        selectedFile = event.target.files[0];
        
        if (selectedFile) {
            if (selectedFile.type === "image/jpeg") {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.classList.remove('d-none');
                    previewText.classList.add('d-none');
                    submitButton.disabled = false; // Enable submit button
                };
                reader.readAsDataURL(selectedFile);
            } else {
                alert('Invalid file type. Please upload a .jpg image.');
                imageUpload.value = ''; // Reset the input
                selectedFile = null;
                imagePreview.classList.add('d-none');
                previewText.classList.remove('d-none');
                submitButton.disabled = true; // Disable submit button
            }
        }
    });

    // Handle form submission
    attendanceForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        if (!selectedFile) {
            alert('Please select an image to upload.');
            return;
        }

        submitButton.textContent = 'UPLOADING...';
        submitButton.disabled = true;
        responseMessage.textContent = '';
        responseMessage.className = 'message-area';

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch(`${API_BASE_URL}${attendanceEndpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || 'Failed to mark attendance.');
            }

            responseMessage.textContent = result.msg || 'Image uploaded successfully!';
            responseMessage.classList.add('success');

        } catch (error) {
            console.error('Attendance Marking Error:', error);
            responseMessage.textContent = `Error: ${error.message}`;
            responseMessage.classList.add('error');
        } finally {
            submitButton.textContent = 'Upload and Mark';
            submitButton.disabled = false; // Re-enable on completion
        }
    });
});
