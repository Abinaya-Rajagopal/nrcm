# Backend - Wound Monitoring API

FastAPI backend for post-operative wound monitoring.

## Quick Start

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000
```

## API Documentation

Once running, access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Demo Mode

The backend currently runs in `DEMO_MODE=True`, returning mock data.
This allows frontend development to proceed without real ML integration.

To check demo mode status:
```bash
curl http://localhost:8000/health
```

## Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI application entry
│   ├── config.py        # Configuration settings
│   ├── schemas.py       # Pydantic models (LOCKED CONTRACT)
│   ├── routes/
│   │   └── analyze.py   # /analyze endpoint
│   ├── services/
│   │   ├── segmentation.py  # Segmentation stub
│   │   ├── metrics.py       # Metrics stub
│   │   └── trajectory.py    # Trajectory stub
│   └── utils/
├── demo_assets/
│   └── wound_images/    # Demo images
├── requirements.txt
└── README.md
```

## ⚠️ Important Notes

- **API Contract is LOCKED** - Do not modify `schemas.py` without team coordination
- **No real ML yet** - All services return mock data
- **DEMO_MODE** controls mock/real behavior
