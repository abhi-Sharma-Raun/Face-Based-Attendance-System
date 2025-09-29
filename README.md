# Full-Stack Face-Based Attendance System

This project is a comprehensive, full-stack solution designed to modernize and automate student attendance management for teachers. It combines a powerful and secure FastAPI backend with a clean, responsive Vanilla JS frontend, leveraging facial recognition to provide a seamless and efficient user experience.

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)

## ✨ Project Highlights & Efficient Implementations

This system was architected with security, efficiency, and scalability in mind. Here are some of its key technical strengths:

#### 1. Intelligent, Two-Layer Face Processing
The project uses a sophisticated, dual-layer approach to handle facial data, ensuring both a smooth user experience and high-quality data.
* **Client-Side Pre-Validation**: The frontend uses **TensorFlow.js** to perform real-time face alignment checks in the browser *before* an image is ever uploaded. This provides instant feedback to the user and prevents the backend from wasting resources processing poor-quality or invalid images (e.g., tilted heads, multiple faces).
* **Server-Side Analysis**: The FastAPI backend uses the powerful **InsightFace** library to perform deep analysis, generating a facial embedding for storage and comparison. This ensures high accuracy during attendance marking.

#### 2. Secure and Robust Authentication
Security is a core component of the system, implemented with modern best practices.
* **JWT & OTP**: The entire authentication flow is built on JWT for session management and a secure OTP (One-Time Password) system for email verification and password resets.
* **Secure Logout**: Upon logout, the active JWT is added to a **Redis denylist**. This is a critical security feature that ensures a token cannot be reused even if it hasn't expired, providing immediate session invalidation.

#### 3. Optimized Attendance Marking Algorithm
The attendance marking process is designed for high efficiency, capable of handling a classroom of any size from a single photo.
* **Batch Processing**: The system detects all faces in an uploaded image at once.
* **Vectorized Calculations**: It uses `NumPy` for highly optimized, vectorized cosine similarity calculations between all detected faces and all enrolled students, avoiding slow, iterative loops and delivering near-instant results.
* **Smart Filtering**: The API intelligently filters out students whose attendance has already been marked for the day, preventing redundant database writes.

#### 4. Modern, Decoupled Architecture
The project follows a clean, decoupled full-stack architecture, making it highly maintainable and scalable.
* **FastAPI Backend**: A modular, high-performance RESTful API that handles all business logic and data processing.
* **Vanilla JS Frontend**: A lightweight and fast frontend built with Vite, providing a modern development workflow and an optimized user-facing application.

## 📂 Project Structure

The project is organized into two primary components within a single monorepo: `backend` and `frontend`. This clean separation makes development and deployment straightforward.
```
Full_FaceAttendance_System/  
├── 📁 backend/  
│   ├── 📁 app/  
│   │   ├── 📁 routers/  
|   |   |   ├── auth.py
|   |   |   ├── create_user.py
|   |   |   ├── delete_account.py
|   |   |   ├── fetch_account.py
|   |   |   ├── mark_attendance.py
|   |   |   ├── password_security.py
|   |   |   ├── students.py 
|   |   |   
│   │   ├── config.py  
│   │   ├── database.py  
│   │   ├── main.py  
│   │   ├── models.py  
│   │   └── schemas.py  
│   ├── .env  
│   ├── Dockerfile  
│   └── requirements.txt  
│
|  
|── 📁 frontend/  
|   ├── 📁 public/  
|   ├── 📁 src/  
|   |   ├── *.js
|   |   └── *.css  
|   |  
|   ├── *.html  
|   ├── .env  
|   ├── package.json
|   ├── package-lock.json
|   └── vite.config.js
```

## 🚀 Getting Started

This project is fully containerized with Docker for easy setup. For detailed manual setup and installation instructions, please refer to the `README.md` files located in the `frontend/` and `backend/` directories respectively.