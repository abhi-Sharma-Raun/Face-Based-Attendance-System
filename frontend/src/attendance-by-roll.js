document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Guard ---
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
    const attendance_roll_Endpoint = import.meta.env.VITE_GET_ATTENDANCE_1_STUDENT


    const attendanceForm = document.getElementById('attendance-form');
    const rollNoInput = document.getElementById('roll-no');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const submitButton = document.getElementById('submit-button');
    
    const resultsContainer = document.getElementById('results-container');
    const resultRollNoSpan = document.getElementById('result-roll-no');
    const attendanceListDiv = document.getElementById('attendance-list');

    attendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const rollNo = rollNoInput.value.trim();
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (!rollNo) {
            alert('Roll Number is a mandatory field.');
            return;
        }

        submitButton.textContent = 'FETCHING...';
        submitButton.disabled = true;
        resultsContainer.classList.add('d-none');
        attendanceListDiv.innerHTML = '<div class="placeholder-text">Loading...</div>';

        
        let url = `${API_BASE_URL}${attendance_roll_Endpoint}/${rollNo}`;
        const params = new URLSearchParams();

        if (startDate) {
            params.append('start_date', startDate);
        }
        if (endDate) {
            params.append('end_date', endDate);
        }
        
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

            const attendance_dates = await response.json();

            const attendanceData = attendance_dates.data;

            // 3. Display the results
            displayResults(rollNo, attendanceData);

        } catch (error) {
            console.error('Error fetching attendance:', error);
            attendanceListDiv.innerHTML = `<div class="placeholder-text error">Error: ${error.message}</div>`;
        } finally {
            submitButton.textContent = 'Get Records';
            submitButton.disabled = false;
            resultsContainer.classList.remove('d-none');
        }
    });

    // --- FUNCTION TO DISPLAY A LIST OF DATES ---
    function displayResults(rollNo, presentDates) {
        resultRollNoSpan.textContent = rollNo;
        attendanceListDiv.innerHTML = ''; // Clear previous content

        if (!presentDates || presentDates.length === 0) {
            attendanceListDiv.innerHTML = '<div class="placeholder-text">No attendance records found for the selected criteria.</div>';
            return;
        }

        // Create an unordered list to display the dates
        const list = document.createElement('ul');
        list.className = 'results-list';
        // Add a header for the list
        const listHeader = document.createElement('li');
        listHeader.className = 'list-header';
        listHeader.textContent = 'Dates Present';
        list.appendChild(listHeader);       
        // Loop through the dates and create a list item for each
        presentDates.forEach(date => {
            const listItem = document.createElement('li');
            listItem.textContent = new Date(date).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }); // Format date for readability
            list.appendChild(listItem);
        });

        attendanceListDiv.appendChild(list);
    }
});

