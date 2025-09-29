document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Guard ---
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
    const allStudentsEndpoint = import.meta.env.VITE_GET_ALL_STUDENTS;

    const listContainer = document.getElementById('student-list-container');
    const searchBar = document.getElementById('search-bar'); // Get the search bar element

    let allStudents = []; // This will store the master list of students fetched from the API

    // Function to fetch and display students
    const fetchAndDisplayStudents = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}${allStudentsEndpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to fetch student list." }));
                throw new Error(errorData.detail || errorData.message);
            }

            const data = await response.json();
            allStudents = data.msg; // Store the original list
            let students = allStudents;
            // Initially, sort and render the full list
            students.sort((a, b) => a.name.localeCompare(b.name));
            renderStudentList(students);

        } catch (error) {
            console.error('Error fetching students:', error);
            listContainer.innerHTML = `<p class="placeholder-text error">Could not load students: ${error.message}</p>`;
        }
    };

    // Function to render a given list of students in the HTML
    const renderStudentList = (students) => {
        listContainer.innerHTML = '';

        if (students.length === 0) {
            listContainer.innerHTML = '<p class="placeholder-text">No students found.</p>';
            return;
        }

        students.forEach(student => {
            const studentItem = document.createElement('div');
            studentItem.className = 'student-item';
            const studentInfo = document.createElement('span');
            studentInfo.textContent = `${student.name} (Roll No: ${student.roll_no})`;
            studentItem.appendChild(studentInfo);
            listContainer.appendChild(studentItem);
        });
    };

    // --- Event listener for the search bar ---
    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();

        // Filter the master list based on the search term
        const filteredStudents = allStudents.filter(student => {
            // Ensure roll_no is treated as a string for searching
            return String(student.roll_no).toLowerCase().includes(searchTerm);
        });

        // Re-render the list with only the filtered results
        renderStudentList(filteredStudents);
    });

    // Initial call to fetch students when the page loads
    fetchAndDisplayStudents();
});

