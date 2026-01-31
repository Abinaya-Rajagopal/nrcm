"""
Post-Operative Wound Monitoring API

FastAPI backend for wound analysis and monitoring.
Currently runs in DEMO_MODE with mock data.

To run:
    uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import DEMO_MODE, API_PREFIX
from .routes import analyze

# Initialize FastAPI app
app = FastAPI(
    title="Wound Monitoring API",
    description="Post-operative wound monitoring and analysis API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(analyze.router, prefix=API_PREFIX)


@app.get("/")
async def root():
    """Root endpoint with API status."""
    return {
        "status": "running",
        "demo_mode": DEMO_MODE,
        "api_docs": "/docs",
        "message": "Wound Monitoring API is running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "demo_mode": DEMO_MODE}
