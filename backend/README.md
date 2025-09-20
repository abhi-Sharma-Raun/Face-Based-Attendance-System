# Face-based Attendance System-Backend  

This application is for teachers.Here they can verify their email then create their account.They can manage their students to their class.They can mark the attendance of the multiple students at a time by clicking thir photo.They can also see the attendance of the students of their class. 

This repository contains the backend service for a real-time, face-based attendance system. Built with FastAPI, this robust API handles user authentication, student management, face registration with alignment checks, and attendance marking through facial recognition.


## ✨ Key Features

* **Secure User Authentication**: JWT-based authentication for     teachers, including registration, login, logout, and account deletion functionalities.

* **Secure Password Management**: Hashing for all user passwords and a secure OTP-based flow for password resets.

* **Email Verification**: Ensures valid teacher accounts by using an OTP verification system before allowing registration.

* **Student Management**: Teachers can add, view, and delete students associated with their account.

* **Advanced Face Processing**: Before registering a student's photo, the system performs a liveness/alignment check to ensure high-quality data. It verifies head pose by checking eye-line angle, mouth-to-nose ratio, and jawline symmetry.

* **Real-time Attendance Marking**: Marks attendance for multiple students from a single class photo by detecting and identifying all faces present.

* **Comprehensive Attendance Reporting**: Fetch attendance records for individual students or download a complete attendance report in CSV format for a given date range.


## 🛠️ Tech Stack

This project leverages a modern and efficient tech stack:

* **Backend Framework**: FastAPI

* **Database**: PostgreSQL

* **ORM**: SQLAlchemy

* **Data Validation**: Pydantic

* **Authentication**: JWT tokens and OAuth2 password flow

* **Password Hashing**: Passlib with bcrypt

* **Face Recognition**: InsightFace (buffalo_l model)

* **Image Processing**: OpenCV & NumPy

* **Caching & OTPs**: Redis is used to store OTPs and denylist JWTs upon logout.

* **Email**: smtplib for sending OTP and confirmation emails.

* **Containerization**: Docker


## ⚙️ How it works

1. **Teacher Registration**: For a teacher creating new account they must first verify their email address.Their email address is verifies as--
* They request an OTP (/send-email-verification-otp), which is sent to their email and stored in Redis.
* After submitting the correct OTP (/verify-email-confirm-otp), their email is marked as verified in the database.
They can then create an account with a user ID and password (/create_user).

2. **Authentication**: Teachers log in using their email and password to receive a JWT access token. This token must be included in the header for all subsequent protected requests. The logout functionality denylists the token in Redis until it expires, preventing reuse.

3. **Adding Students**: A teacher can add students to the class. This requires submitting the student's name, roll number, and a clear photo. The backend processes the image to ensure only one face is present and that it is clear and well-aligned(i.e., not tilted or turned). If the checks pass, the facial embedding (a vector representation of the face) is generated and stored in the database.

4. **Marking Attendance**: To take attendance, the teacher uploads a single photo of the classroom. The system detects all faces in the image and generates embeddings for each one. It then calculates the cosine similarity between the detected faces and the stored embeddings of all students registered to that teacher. If the similarity for a given student exceeds a predefined threshold (face_attendance_similarity_threshold), they are marked as present for the current date. The system is optimized to not mark students who are already marked present for the day.

5. **Fetching Attendance**: Teachers can view the attendance record for a specific student or download a complete CSV report for all their students, filterable by a date range.


<h2>📖  API Endpoints </h2>

<br>Here is a summary of the available API endpoints. (Auth Required) indicates that a valid JWT bearer token is required in the Authorization header.</br>

<h3>Create Account </h3>

<table>
  <tr>
    <th> Method</th>
    <th>Endpoint</th>
    <th>Description</th>
    <th>Auth Required</th>
  </tr>
  <tr>
    <td>POST</td>
    <td>/send-email-verification-otp</td>
    <td>Sends an OTP to the provided email for verification.</td>
    <td>No</td>
  </tr>
  <tr>
    <td>POST</td>
    <td>/verify-email-confirm-otp</td>
    <td>Verifies the OTP to validate an email address.</td>
    <td>No</td>
  </tr>
  <tr>
    <td>POST</td>
    <td>/create_user</td>
    <td>Creates a new teacher account with a verified email.</td>
    <td>No</td>
  </tr>
</table>

<h3>Authentication</h3>

<table>
  <tr>
    <th>Method</th>
    <th>Endpoint</th>
    <th>Description</th>
    <th>Auth Required</th>
  </tr>
  <tr>
    <td>POST</td>
    <td>/login</td>
    <td>Authenticates the user credentials and returns a JWT token.</td>
    <td>No</td>
  </tr>
  <tr>
    <td>POST</td>
    <td>/logout</td>
    <td>Logs out the user by denylisting the active token.</td>
    <td>Yes</td>
  </tr>
</table>

<h3>Manage Students</h3>

<table>
  <tr>
    <th>Method</th>
    <th>Endpoint</th>
    <th>Description</th>
    <th>Auth Required</th>
  </tr>
  <tr>
    <td>POST</td>
    <td>/addStudent</td>
    <td>Adds a new student with his/her photo and details</td>
    <td>Yes</td>
  </tr>
  <tr>
    <td>GET</td>
    <td>/get_all_students</td>
    <td>Retrieves a list of all students for the teacher.</td>
    <td>Yes</td>
  </tr>
  <tr>
    <td>DELETE</td>
    <td>/delete_student/{roll_no}</td>
    <td>Deletes a student by their roll no.</td>
    <td>Yes</td>
  </tr>
</table>

<h3>Mark & Fetch Attendance</h3>

<table>
  <tr>
    <th>Method</th>
    <th>Endpoint</th>
    <th>Description</th>
    <th>Auth Required</th>
  </tr>
  <tr>
    <td>POST</td>
    <td>/mark_attendance</td>
    <td>Marks attendance from a single classroom image.Marks the attendance of all students present in that image</td>
    <td>Yes</td>
  </tr>
  <tr>
    <td>GET</td>
    <td>/get-attendance/{roll_no}</td>
    <td>Fetches all attendance records for a specific student.</td>
    <td>Yes</td>
  </tr>
  <tr>
    <td>GET</td>
    <td>/get-all-attendance</td>
    <td>Downloads a CSV report of all student attendance, filterable by date.The start and end date are passed as query parameters.</td>
    <td>Yes</td>
  </tr>
</table>

<h3>Account Management</h3>

<table>
  <tr>
    <th>Method</th>
    <th>Endpoint</th>
    <th>Description</th>
    <th>Auth Required</th>
  </tr>
  <tr>
    <td>POST</td>
    <td>/forgot-password-send-otp</td>
    <td>Sends a password reset OTP to the user's email.</td>
    <td>Yes</td>
  </tr>
  <tr>
    <td>PUT</td>
    <td>/forgot-password-verify-otp</td>
    <td>Verifies OTP and sets a new password.</td>
    <td>Yes</td>
  </tr>
  <tr>
    <td>DELETE</td>
    <td>/delete_account</td>
    <td>Deletes the authenticated user's account and all data.</td>
    <td>Yes</td>
  </tr>
</table>


## Running the project locally(Without Docker)

### Prerequisites

* Python 3.12.3
* PostgreSQL
* Redis

Now to run the project locally first you need to clone this repository install necessary dependencies and setup environment variables.All the steps for this are shown below--

1. Clone this repository  
`git clone <https://github.com/abhi-Sharma-Raun/Face-Based-Attendance-System.git>`

2. Go in the backend directory of this cloned repo

3. Setup environment variables  
  Create a .env file in the root directory and populate it with the necessary credentials. You can use config.py as reference.
  Also, you can see the .env file i have put below in this README file.

4. Create a Virtual Environemnt in the backend directory and install all the necessary dependencies  
`python -m venv venv`
`source venv/bin/activate`  
`pip install -r requirements.txt`

5.Run the application  
`uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

## Set up Environment variables

To run this project, you will need to add the following environment variables to your .env file.The .env file must be present in the root directory(backend).
You can use config.py as reference for environment variables.

#### Database Credentials
```
database_username=your_postgres_user  
database_password=your_postgres_password  
database_hostname=localhost  
database_port=5432  
database_name=your_db_name  
```

#### JWT Settings
```
SECRET_KEY=your_super_secret_key  
ALGORITHM=HS256  
ACCESS_TOKEN_EXPIRE_MINUTES=60  
```

#### Email Credentials 
```
# This email id is used to send emails to user's accounts for otp,account-confirmation, email-verification,etc.

email_Id=your_gmail_address@gmail.com  
email_id_app_password=your_gmail_app_password  
```

#### Redis Connection
```
redis_host=localhost  
redis_port=6379
```

#### CORS Origins
```
dev_url=http://localhost:3000  
prod_url=https://your-frontend-domain.com  
```

#### Face Recognition Thresholds
```
face_attendance_similarity_threshold=0.6  
eye_mouth_thresh=0.4  
eye_angle_thresh=10.0  
jawline_symmetry_thresh=8.0  
nose_mouth_ratio_lower=1.5  
nose_mouth_ratio_upper=2.5
```







 