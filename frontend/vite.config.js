import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  
  build: {
    rollupOptions: {
      input: {
        // This is your main entry point
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        remove_student: resolve(__dirname, 'remove-student.html'),
        create_account: resolve(__dirname, 'register.html'),
        mark_attendance: resolve(__dirname, 'mark-attendance.html'),
        manage_students: resolve(__dirname, 'manage-students.html'),
        forgot_password: resolve(__dirname, 'forgotPassword.html'),
        email_verification: resolve(__dirname, 'email-verification.html'),
        attendance_menu:resolve(__dirname, 'check-attendance-menu.html'),
        check_attendance_by_rollno: resolve(__dirname, 'attendance-by-roll.html'),
        check_all_students_attendance: resolve(__dirname, 'attendance-by-date.html'),
        show_all_students: resolve(__dirname, 'all-students.html'),
        add_student_details: resolve(__dirname, 'add-student-details.html'),
        add_student_final: resolve(__dirname, 'add_student_final.html')
      },
    },
  },
});