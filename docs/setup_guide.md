# Development Setup Guide

## 1. Create Virtual Environment
Open your terminal in the `nrcm` directory and run:
```powershell
# Create the virtual environment named 'venv'
python -m venv venv
```

## 2. Activate Virtual Environment
```powershell
# Windows (PowerShell)
.\venv\Scripts\Activate
```
> **Note**: If you see an execution policy error, you can just run commands using `.\venv\Scripts\python` directly, or run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`.

## 3. Install Dependencies
```powershell
pip install -r backend/requirements.txt
```

## 4. Run the Backend Server
```powershell
# Start the server with hot-reload enabled
python -m uvicorn backend.app.main:app --reload
```
The API will be available at `http://127.0.0.1:8000`.

## 5. Verify the Installation
You can run the verification script I created:
```powershell
python tests/verify_orchestration.py
```

## Reviewing Implementation (Person 1)
I have already implemented the orchestration logic for you. You can review the changes in:
- `backend/app/routes/analyze.py` (Orchestration logic)
- `backend/app/services/segmentation.py` (Updated stubs)
- `backend/app/services/metrics.py` (Updated stubs)
- `backend/app/services/trajectory.py` (Updated stubs)
