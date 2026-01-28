# Geolocation Based Attendance Tracker

A full-stack application for managing employee attendance using interactive geofencing.

## Credentials

### Admin Dashboard
- **URL**: [http://localhost:3000/login](http://localhost:3000/login)
- **Email**: `admin@example.com`
- **Password**: `admin123`

### Employee Dashboard
- **URL**: [http://localhost:3000/login](http://localhost:3000/login)
- **Email**: `user@example.com`
- **Password**: `user123`

## Features
- **Interactive Geofencing**: Admins can click on the map to create and drag geofence zones.
- **Real-time Tracking**: Employees' locations are monitored using high-accuracy GPS.
- **Strict Enforcement**: Attendance can only be marked if the employee is within the assigned geofence.
- **Session Management**: Supports multiple shifts (Morning, Afternoon, etc.).

## Setup Instructions

### Backend
1. Navigate to `backend/`
2. Create virtual environment: `python -m venv venv`
3. Activate: `.\venv\Scripts\activate`
4. Install: `pip install -r requirements.txt`
5. Initialize DB: `python init_db.py`
6. Run: `uvicorn app.main:app --reload`

### Frontend
1. Navigate to `frontend/`
2. Install: `npm install`
3. Run: `npm run dev`
