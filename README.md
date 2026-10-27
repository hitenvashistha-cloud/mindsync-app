# 🧠 MindSync — Mental Wellness Analytics

![MindSync Banner](https://img.shields.io/badge/Status-Live-success) ![Python](https://img.shields.io/badge/Python-3.10+-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal) ![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.2+-orange)

**MindSync** is a full-stack Machine Learning web application that predicts a student's mental health score (0–10) based on their digital habits, lifestyle, and stress levels. 

Unlike a standard Jupyter Notebook project, this is a complete, deployed application with a custom backend, real-time validation, and a modern, responsive dashboard.

🔗 **[View the Live Application Here](https://mindsync-app.onrender.com/)**

---

## ✨ Features

*   **🧠 Machine Learning Predictions:** Utilizes a trained `scikit-learn` pipeline (saved via `joblib`) to calculate a mental health score.
*   **⚡ Real-Time Data Validation:** Prevents impossible data entry (e.g., logging 30 hours of activity in a 24-hour day).
*   **📊 Interactive Dashboard:** A dynamic UI built with Vanilla JS that visualizes the score using an animated SVG gauge that changes color (Red/Orange/Green) based on the result.
*   **💡 Actionable Advice:** The app analyzes your inputs and provides personalized tips (e.g., "Try getting more sleep" or "Reduce screen time").
*   **👋 Personalized UX:** Uses `localStorage` for a smooth onboarding experience and personalized greetings.
*   **🔒 Single-Server Architecture:** FastAPI serves both the backend API (`/predict`) and the frontend static files, eliminating CORS issues.

---

## 🛠️ Tech Stack

**Frontend:**
*   HTML5 & CSS3 (Custom Variables, Flexbox, Grid)
*   Vanilla JavaScript (DOM Manipulation, Fetch API, LocalStorage)
*   SVG (For the dynamic animated gauge)

**Backend & ML:**
*   Python 3
*   FastAPI (For the REST API and Static File Serving)
*   Pydantic (For strict data validation)
*   Scikit-Learn & Pandas (For the ML Pipeline)
*   Joblib (For model serialization)

**Deployment:**
*   Render (Cloud Hosting)
*   GitHub (Version Control)

---

## 📂 Project Structure

```text
mindsync-app/
│
├── static/                 # Frontend files
│   ├── index.html          # Main dashboard UI
│   ├── style.css           # Custom styling & responsive design
│   └── script.js           # App logic, form validation, & API calls
│
├── main.py                 # FastAPI backend & ML model loading
├── Mental_Health_Model.pkl # Trained Scikit-Learn pipeline
├── requirements.txt        # Python dependencies
└── README.md               # Project documentation
