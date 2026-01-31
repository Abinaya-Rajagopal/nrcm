# Post-Operative Wound Monitoring Application

A web application for monitoring post-operative wound healing with visual analytics.

## 🎯 Project Goal

Enable healthcare providers to track wound healing progression through:
- Wound area measurement
- Redness and exudate detection
- Healing trajectory visualization
- Risk level assessment

## 📁 Project Structure

```
nrcm/
├── frontend/          # React + TypeScript + Vite
├── backend/           # FastAPI Python backend
├── shared/            # Shared documentation and contracts
├── docs/              # Project documentation
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.10+ (for backend)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at: http://localhost:8000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at: http://localhost:5173

## 🔧 Demo Mode

Both frontend and backend currently run in **DEMO_MODE**, returning mock data.
This allows parallel development without requiring real ML integration.

Check backend status:
```bash
curl http://localhost:8000/health
```

## ⚠️ Important: API Contract

**The API contract is LOCKED and must not be changed without team coordination.**

See: `shared/api_contract.md`

The `/analyze` endpoint returns this exact structure:
```json
{
  "area_cm2": 12.4,
  "redness_pct": 18.2,
  "pus_pct": 4.1,
  "risk_level": "AMBER",
  "trajectory": {
    "expected": [12.0, 10.8, 9.7, 8.7, 7.8],
    "actual": [12.0, 11.5, 11.3, 11.2, 11.2]
  },
  "alert_reason": "Healing stalled for 2 days"
}
```

## 👥 Team Workflow

1. **Clone the repository**
2. **Start backend** on port 8000
3. **Start frontend** on port 5173
4. **Work on your assigned component**

### Parallel Development Areas

| Area | Owner | Location |
|------|-------|----------|
| Dashboard UI | Frontend team | `frontend/src/pages/` |
| Metrics Display | Frontend team | `frontend/src/components/` |
| Segmentation Service | ML team | `backend/app/services/segmentation.py` |
| Metrics Extraction | CV team | `backend/app/services/metrics.py` |
| Trajectory Analysis | Backend team | `backend/app/services/trajectory.py` |

## 📝 Key Documentation

- `shared/api_contract.md` - **LOCKED** API specification
- `shared/constants.md` - Shared constants and definitions
- `backend/README.md` - Backend setup and structure
- `frontend/README.md` - Frontend setup (Vite defaults)

## 🚫 What NOT To Build Yet

- ❌ Real MobileSAM integration
- ❌ OpenCV/CV processing
- ❌ Model training or fine-tuning
- ❌ Authentication
- ❌ Cloud deployment
- ❌ Database integration

This is a **skeleton project** for coordination. Feature implementation comes later.

## 📄 License

Internal project - Not for public distribution.
