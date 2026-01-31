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

# Features Roadmap & Team Work Allocation

This document defines:
- The **final feature set** to be added to the project
- What is explicitly **out of scope**
- A clear, equal **work distribution across 6 team members**

This file is for **internal coordination** and should be treated as a **working contract**.

---

## Selected Features to Add (LOCKED)

The following features are **approved for implementation**.  
They are chosen for **high impact, low risk, and hackathon feasibility**.

### Feature 1: Progressive Explanation System (Explainable AI)

**Description**  
Every result exposes 3 levels of explanation:
- Level 1: Simple status (e.g., "Healing normally")
- Level 2: Why it matters (plain-language reasoning)
- Level 3: How it was calculated (rules + logic, not equations)

**Why it matters**
- Demonstrates Explainable AI (XAI)
- Builds judge trust
- Reduces "black box" perception

---

### Feature 2: Before / After Comparison Slider

**Description**
- Interactive slider comparing Day 1 vs Latest image
- Shows visible healing progression
- Displays % area reduction or increase

**Why it matters**
- Strong visual impact
- Shows temporal reasoning
- Easy to understand in a live demo

---

### Feature 3: Explainable Alert Cards

**Description**
Instead of generic alerts, show explicit reasons:
- "Wound area increased by 6% over last 48 hours"
- "Peri-wound redness increased by 18%"

**Why it matters**
- Transparent decision-making
- Clinically intuitive
- Reinforces trust in alerts

---

## Optional Enhancements (Only If Time Permits)

These features may be added **only after** the core three above are complete.

### Confidence Bands on Healing Trajectory
- Upper and lower tolerance range around expected curve
- Visual shaded region on chart

### Visual Change Heatmap
- Pixel-wise difference between consecutive days
- Highlights regions of stalled or worsening healing

---

## Explicitly Out of Scope (DO NOT IMPLEMENT)

The following are **intentionally excluded** to avoid credibility and scope risks:

- Infection diagnosis or prediction
- Clinical accuracy claims
- Deep learning classifiers
- Healing completion date prediction
- One-tap report sharing (PDF/email)
- Real-time continuous monitoring
- Regulatory or deployment claims
- Patient risk factor personalization

If any of these appear in code or slides, they must be removed.

---

## Team Work Allocation (Equal Split Across 6 People)

Each person owns a **distinct, non-overlapping slice** of the system.

---

### Person 1 — Backend Integration & Orchestration

**Primary Responsibility**
- Own `/api/v1/analyze` orchestration logic

**Tasks**
- Replace mock pipeline with real service calls
- Integrate:
  - segmentation
  - metrics
  - trajectory
- Preserve DEMO_MODE fallback
- Ensure locked API contract is respected

**Primary Files:**
- `backend/app/routes/analyze.py`
- `backend/app/main.py`
- `backend/app/config.py`

**Does NOT work on**
- Frontend UI
- CV internals

---

### Person 2 — Segmentation (Computer Vision)

**Primary Responsibility**
- Wound and peri-wound segmentation

**Tasks**
- Integrate MobileSAM inference
- Handle point prompts
- Generate:
  - wound mask
  - peri-wound mask (20px dilation)

**Primary Files:**
- `backend/app/services/segmentation.py`

**Does NOT work on**
- Metrics
- Trajectory
- Frontend

---

### Person 3 — Metric Computation (OpenCV / HSV)

**Primary Responsibility**
- Quantitative healing metrics

**Tasks**
- HSV conversion
- Compute:
  - wound area (cm²)
  - redness %
  - pus %
- Implement heuristic risk score

**Primary Files:**
- `backend/app/services/metrics.py`
- `backend/app/config.py` (risk thresholds only)

**Does NOT work on**
- Segmentation
- UI
- Trajectory

---

### Person 4 — Healing Trajectory & Alert Logic

**Primary Responsibility**
- Temporal reasoning and alerts

**Tasks**
- Implement Gilman healing curve
- Compare expected vs actual
- Determine risk level (GREEN / AMBER / RED)
- Generate explainable alert reasons

**Primary Files:**
- `backend/app/services/trajectory.py`
- `shared/constants.md` (risk level definitions)

**Does NOT work on**
- CV
- Frontend UI

---

### Person 5 — Frontend Data & State Integration

**Primary Responsibility**
- Frontend–backend data flow

**Tasks**
- Consume `/analyze` API
- Handle loading, error, demo states
- Normalize backend response for UI components

**Primary Files:**
- `frontend/src/api/analyze.ts`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/config.ts`

**Does NOT work on**
- Backend logic
- Visual design polish

---

### Person 6 — Frontend Visualization & UX Features

**Primary Responsibility**
- User-facing visual features

**Tasks**
- Metrics cards
- Trajectory chart rendering
- Before/After comparison slider
- Progressive explanation UI
- Explainable alert cards

**Primary Files:**
- `frontend/src/components/MetricsCard.tsx`
- `frontend/src/components/TrajectoryChart.tsx`
- `frontend/src/pages/Dashboard.tsx` (UI sections only)

**Does NOT work on**
- Backend
- API design

---

## Non-Negotiable Rules

1. **API contract is locked.** The response structure defined in `shared/api_contract.md` must not be modified. Any required changes must be coordinated across the entire team before implementation.

2. **No training or datasets.** This project does not involve model training, fine-tuning, or dataset management. Demo images are static assets only.

3. **DEMO_MODE must never break.** All implementations must preserve the ability to return mock data when `DEMO_MODE = True`. This ensures frontend development is never blocked.

4. **Changes require coordination.** Modifications to shared files (`schemas.py`, `api_contract.md`, `constants.md`) require team discussion before committing.

5. **No scope expansion without team agreement.**

---

## Success Criteria

This feature phase is successful if:
- Demo runs deterministically
- Judges can understand results in <30 seconds
- Every alert is explainable
- Visual change over time is obvious
- All 6 members contribute code

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
| Progressive Explanation System | Not started |
| Before/After Comparison Slider | Not started |
| Explainable Alert Cards | Not started |

---

**This document defines the final execution scope.**

*Last updated: 2026-01-31*
