document.addEventListener('DOMContentLoaded', () => {

    const detailsForm = document.getElementById('student-details-form');
    const nameInput = document.getElementById('student-name');
    const rollNoInput = document.getElementById('roll-no');

    detailsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        const rollNo = rollNoInput.value.trim();

        if (name === '' || rollNo === '') {
            alert('Please fill out both name and roll number.');
            return;
        }

        // Store details in session storage to pass them to the next page
        sessionStorage.setItem('newStudentName', name);
        sessionStorage.setItem('newStudentRollNo', rollNo);

        // Redirect to the photo capture page
        window.location.href = 'add_student_final.html';
    });
});

