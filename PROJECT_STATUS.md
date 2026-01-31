# PROJECT_STATUS.md

## Project Status Overview

The base skeleton for the Post-Operative Wound Monitoring Application is **complete and verified**. Both the backend (FastAPI) and frontend (React + TypeScript) are runnable and can be developed in parallel without conflicts.

**Critical locks in place:**
- API contract is finalized and must not be modified without team coordination
- DEMO_MODE behavior is implemented and must remain functional at all times
- Repository structure is fixed; no additional top-level folders should be added

---

## What Is Done (Locked)

The following components are complete and should not be reworked unless a critical bug is found.

### Repository Structure

- `nrcm/frontend/` — Vite + React + TypeScript application
- `nrcm/backend/` — FastAPI Python backend
- `nrcm/shared/` — Shared documentation and API contracts
- `nrcm/docs/` — Project documentation placeholder
- `nrcm/README.md` — Root project documentation

### Backend FastAPI Skeleton

- `backend/app/main.py` — FastAPI application entry point with CORS configured
- `backend/app/config.py` — Configuration with `DEMO_MODE = True`
- `backend/app/schemas.py` — Pydantic models matching locked API contract
- `backend/app/routes/analyze.py` — `/analyze` endpoint implementation
- `backend/app/services/` — Service stubs for segmentation, metrics, trajectory
- `backend/requirements.txt` — Minimal dependencies defined

### /analyze Endpoint

- Returns mock data when `DEMO_MODE = True`
- Response structure matches locked contract exactly
- Accessible at `POST /api/v1/analyze`

### DEMO_MODE Implementation

- Defined in `backend/app/config.py`
- All service functions branch on this flag
- Frontend displays demo mode indicator
- Health endpoint reports demo mode status

### Frontend Skeleton

- `frontend/src/pages/Dashboard.tsx` — Main dashboard page
- `frontend/src/components/MetricsCard.tsx` — Metric display component
- `frontend/src/components/TrajectoryChart.tsx` — SVG-based chart component
- `frontend/src/api/analyze.ts` — API client with TypeScript types
- `frontend/src/config.ts` — Frontend configuration

### Locked API Contract

Location: `shared/api_contract.md`

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

This structure is immutable. Frontend and backend development depend on it.

### Demo Assets and Data Hygiene

- `backend/demo_assets/wound_images/primary/` — 5 curated demo images
- `backend/demo_assets/wound_images/fallback/` — 5 fallback demo images
- Images renamed to `demo_XX.jpg` to remove dataset semantics
- No class labels, medical categories, or dataset provenance exposed

### Team Parallelization Readiness

- Backend runs independently on port 8000
- Frontend runs independently on port 5173
- Mock data enables frontend development without real ML
- Service stubs allow backend development without blocking

---

## What Still Needs to Be Done

### Segmentation Logic (MobileSAM Integration)

Implement wound boundary detection using MobileSAM. Generate wound mask and peri-wound region mask from input images. Currently returns mock data from `backend/app/services/segmentation.py`.

### Metric Computation (OpenCV / HSV)

Calculate wound area in cm², redness percentage, and exudate/pus percentage using HSV color space analysis on segmented regions. Currently returns mock values from `backend/app/services/metrics.py`.

### Healing Trajectory and Alert Logic (Gilman Model)

Implement expected healing curve calculation based on initial wound area. Compare actual trajectory against expected. Generate risk level (GREEN/AMBER/RED) and alert reasons. Currently returns mock data from `backend/app/services/trajectory.py`.

### Backend Orchestration

Replace mock responses in `/analyze` with real computed values. Coordinate calls to segmentation, metrics, and trajectory services. Maintain DEMO_MODE fallback for when real processing is unavailable.

### Frontend Integration with Real Backend Data

Connect frontend components to live backend responses. Handle loading states, error states, and graceful degradation. Validate response structure matches contract.

### Demo Flow Polish and Fallback Handling

Ensure demo images load correctly when camera input fails. Polish UI presentation for demonstration purposes. Verify fallback behavior across all edge cases.

---

## Team Work Allocation

### Person 1 — Backend Orchestration and Integration

**Responsibilities:**
- Own the `/analyze` endpoint in `backend/app/routes/analyze.py`
- Combine outputs from segmentation, metrics, and trajectory services
- Maintain DEMO_MODE fallback behavior
- Final backend integration and testing

**Primary Files:**
- `backend/app/routes/analyze.py`
- `backend/app/main.py`
- `backend/app/config.py`

**Not Responsible For:**
- Implementing segmentation algorithms
- Implementing metric extraction algorithms
- Frontend code

---

### Person 2 — Segmentation (Computer Vision)

**Responsibilities:**
- Implement MobileSAM inference pipeline
- Generate wound mask from input image
- Generate peri-wound region mask
- Ensure deterministic and reproducible output

**Primary Files:**
- `backend/app/services/segmentation.py`

**Not Responsible For:**
- Metric calculation from masks
- Trajectory modeling
- Frontend visualization of masks

---

### Person 3 — Metric Computation (OpenCV)

**Responsibilities:**
- Compute wound area in cm² from segmentation mask
- Calculate redness percentage using HSV analysis
- Calculate exudate/pus percentage using HSV analysis
- Implement risk indicator heuristic based on thresholds

**Primary Files:**
- `backend/app/services/metrics.py`
- `backend/app/config.py` (risk thresholds only)

**Not Responsible For:**
- Generating segmentation masks
- Trajectory prediction
- Frontend rendering

---

### Person 4 — Healing Trajectory and Alert Logic

**Responsibilities:**
- Implement Gilman healing model for expected trajectory
- Calculate expected vs actual trajectory comparison
- Determine risk level (GREEN / AMBER / RED)
- Generate alert reason text based on deviation patterns

**Primary Files:**
- `backend/app/services/trajectory.py`
- `shared/constants.md` (risk level definitions)

**Not Responsible For:**
- Segmentation
- Metric extraction
- Frontend chart rendering

---

### Person 5 — Frontend Data and State Integration

**Responsibilities:**
- Connect frontend to `/analyze` endpoint
- Manage loading, error, and success states
- Handle demo mode indicator display
- Normalize and validate backend response for UI consumption

**Primary Files:**
- `frontend/src/api/analyze.ts`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/config.ts`

**Not Responsible For:**
- Component styling or layout
- Chart rendering logic
- Backend implementation

---

### Person 6 — Frontend Visualization and Overlay

**Responsibilities:**
- Metrics cards UI refinement
- Trajectory chart rendering and styling
- Risk badge display with appropriate colors
- Segmentation overlay visualization (when available)

**Primary Files:**
- `frontend/src/components/MetricsCard.tsx`
- `frontend/src/components/TrajectoryChart.tsx`
- `frontend/src/pages/Dashboard.tsx` (UI sections only)

**Not Responsible For:**
- API client implementation
- State management
- Backend services

---

## Non-Negotiable Rules

1. **API contract is locked.** The response structure defined in `shared/api_contract.md` must not be modified. Any required changes must be coordinated across the entire team before implementation.

2. **No training or datasets.** This project does not involve model training, fine-tuning, or dataset management. Demo images are static assets only.

3. **DEMO_MODE must never break.** All implementations must preserve the ability to return mock data when `DEMO_MODE = True`. This ensures frontend development is never blocked.

4. **Changes require coordination.** Modifications to shared files (`schemas.py`, `api_contract.md`, `constants.md`) require team discussion before committing.

---

## Quick Reference

| Item | Status |
|------|--------|
| Repository structure | Locked |
| API contract | Locked |
| Backend skeleton | Complete |
| Frontend skeleton | Complete |
| DEMO_MODE | Implemented |
| Demo assets | Curated |
| Segmentation logic | Not started |
| Metric computation | Not started |
| Trajectory logic | Not started |
| Backend orchestration | Stub only |
| Frontend integration | Mock only |

---

*Last updated: 2026-01-31*
