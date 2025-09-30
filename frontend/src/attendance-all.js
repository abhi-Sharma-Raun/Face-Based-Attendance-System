document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Guard ---
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL; // Your backend URL
    const all_attendance_endpoint = import.meta.env.VITE_GET_ATTENDANCE_ALL_STUDENTS; // Endpoint for all student's attendance

    // Get elements
    const attendanceForm = document.getElementById('attendance-form');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const fetchButton = document.getElementById('fetch-button');
    const resultsContainer = document.getElementById('results-container');
    const downloadButton = document.getElementById('download-button');
    const responseMessage = document.getElementById('response-message');


    let downloadedBlob = null;    // cache for CSV Blob


    // 1. Listen for form submission to check for data and show download button
    attendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        fetchButton.textContent = 'CHECKING...';
        fetchButton.disabled = true;
        resultsContainer.classList.add('d-none'); // Hide previous results
        responseMessage.textContent = '';
        responseMessage.className = 'message-area';

        // Construct the URL with query parameters
        let url = `${API_BASE_URL}${all_attendance_endpoint}`;
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        try {
            const response = await fetch(url, {
                method: 'GET', 
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Could not fetch attendance data.');
            }

            downloadedBlob = await response.blob();

            resultsContainer.classList.remove('d-none');

        } catch (error) {
            console.error('Error fetching attendance:', error);
            resultsContainer.classList.remove('d-none');
            downloadButton.style.display = 'none'; // Hide download button on error
            responseMessage.textContent = `Error: ${error.message}`;
            responseMessage.className = 'message-area error';

        } finally {
            fetchButton.textContent = 'Show Download Link';
            fetchButton.disabled = false;
        }
    });


    // 2. Handle the "Download" button click
    downloadButton.addEventListener('click', async () => {

        if(!downloadedBlob){
            console.log("There is no data to be downloaded");
            return;
        }
        
        try{
            const downloadUrl = window.URL.createObjectURL(downloadedBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            // Name the file dynamically, e.g., attendance_2023-10-27.csv
            a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            a.remove();
        } catch (error) {
            console.log(`Client-side Error: ${error}`);
        }

    });
});
