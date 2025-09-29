# Face Attendance System Frontend

A web-based application designed to streamline and automate the process of student attendance management for teachers using facial recognition technology. This project provides a secure, efficient, and user-friendly interface for managing students and tracking their attendance.

## Key Features

* ### Secure Teacher/User Authentication__:
    A complete authentication system for teachers, including:
> - User Registration with Email Verification (OTP).  
> - Secure login and logout functionality using JWT Tokens.
> - Password Recovery using OTP sent to registered email.  
* ### Intuitive Teacher Dashboard__:
  A central hub providing easy access to all major features of the application.  
* ### Comprehensive Student Management:  
> - __Add Student__: Enroll new students with their name and roll number.  
> - __View All Students__: A searchable list of all enrolled students.  
> - __Remove Student__: Securely delete a student's record with a confirmation step.  
* __Smart Student with Client-Side Ai__:
> - A two-step student registration process that uses TensorFlow.js directly in the browser.
> - The system pre-validates the student's photo to ensure proper face alignment and quality before uploading, reducing unnecessary backend API calls and ensuring high-quality data.
* __Automated Attendance Marking__:
> - Teachers can upload a single class photograph.
> - The backend processes the image to recognize all the present students
* __Detailed Attendance Reporting__:
> - __By Individual Student__: View the complete attendance history for a specific student by searching their roll number, with an optional date range filter.
> - __For All Students__: Download a comprehensive attendance report in .csv format for the entire class, filterable by a date range.

## Technology Stack

* ### Frontend
> - __Core__: HTML5, CSS3, Vanilla JavaScript (ES6+)
> - __Build Tool__: [Vite](https://vite.dev/) for a fast development experience and optimized builds.
> - __AI/ML__: [TensorFlow.js](https://www.tensorflow.org/js) for in-browser face detection and pre-validation.
* ### Backend(inferred): 
> - A RESTful API to handle user authentication, student data, and facial recognition processing.

## Getting Started

Follow these instructions to set up and run the frontend project on your local machine.

### Prerequisites  
> - Node.js (which includes npm) installed on your system.
> - A running instance of the corresponding backend server.
### Installation
1. Clone this repository.  
2. Navigot to the frontend directory of the project  
   `cd frontend`
3. Install the required npm packages  
   `npm install`
### Configuration
1. create a `.env` file at the root of the `frontend` directory and populate it with all the necessary env variables.
2. you can see all the necessary .env variables i have attached below for your reference.
### Running the application  
> - start the vite development server  
  `npm run dev`
> - Open your browser and navigate to the local url provided by vite (usually http://localhost//5173).

## Set up environment variables

### Backend Base URL
```
VITE_BACKEND_BASE_URL=http://localhost:8000  # fastAPI runs on port 8000 by default
```
### Backend endpoints  

I have added them as env variables as in production one would not want
to hardcode them and expose the endpoints leading to a security risk  

#### Authentication endpoints  
```
VITE_LOGIN=/login
VITE_LOGOUT=/logout
```
#### Create Acoount and Email Verification  
```
VITE_SEND_VERIFICATION_EMAIL=/send-email-verification-otp
VITE_VERIFY_EMAIL=/verify-email-confirm-otp
VITE_CREATE_ACCOUNT=/create_user
```
#### Password Reset  
```
VITE_FORGOT_PASSWORD_OTP=/forgot-password-send-otp
VITE_FORGOT_PASSWORD_VERIFY_OTP_RESET_PASSWORD=/forgot-password-verify-otp
```
#### Manage Students
```
VITE_ADD_STUDENT=/addStudent
VITE_GET_ALL_STUDENTS=get_all_students
VITE_DELETE_STUDENT=delete_student  
```
#### Mark & Fetch Attendance 
```
VITE_MARK_ATTENDANCE=/mark_attendance
VITE_GET_ATTENDANCE_1_STUDENT=/get-attendance 
VITE_GET_ATTENDANCE_ALL_STUDENTS=/get-all-attendance
```

### Face Alignment Parameters 
```
VITE_EYE_ANGLE_THRESH=15
VITE_NOSE_MOUTH_LEFT_THRESH=1.4
VITE_NOSE_MOUTH_RIGHT_THRESH=2.0
VITE_EAR_DIST_RATIO_LEFT_THRESH=0.7
VITE_EAR_DIST_RATIO_RIGHT_THRESH=1.3
VITE_MOUTH_EYE_NORMALIZED_THRESH=0.25
```
