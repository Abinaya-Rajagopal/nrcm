# Application Constants

Shared constants and definitions for the wound monitoring application.

---

## DEMO_MODE

**Definition:** A boolean flag that controls whether the application uses mock data or real processing.

| Value | Behavior |
|-------|----------|
| `true` | All endpoints return mock/synthetic data. No real ML or CV processing. |
| `false` | Real processing logic is invoked (not yet implemented). |

**Usage:**
- Frontend: Check `/health` endpoint for current mode
- Backend: Set in `backend/app/config.py`

**Default:** `DEMO_MODE = True`

---

## Risk Levels

Risk levels indicate the assessed healing status. These are **heuristic indicators**, not clinical diagnoses.

| Level | Color | Meaning |
|-------|-------|---------|
| `GREEN` | 🟢 | Healing as expected. No intervention needed. |
| `AMBER` | 🟠 | Healing slower than expected. Monitor closely. |
| `RED` | 🔴 | Healing stalled or worsening. Review recommended. |

### Threshold Guidelines (Heuristic)

| Level | Area Change | Redness Max | Exudate Max |
|-------|-------------|-------------|-------------|
| GREEN | < -5% daily | < 15% | < 2% |
| AMBER | -5% to 0% daily | 15-25% | 2-8% |
| RED | > 0% (increasing) | > 25% | > 8% |

---

## Important Disclaimers

⚠️ **Metrics are heuristic, not diagnostic.**

- All metrics are computed using image analysis algorithms
- They are intended for **monitoring trends**, not clinical decision-making
- Risk levels are **suggestive indicators** only
- Always defer to qualified medical professionals for diagnosis

⚠️ **Healing progression in demos uses synthetic data.**

- Demo trajectory charts show simulated healing curves
- Actual patient data is never used for demonstration purposes

---

## Units

| Metric | Unit | Precision |
|--------|------|-----------|
| Wound Area | cm² | 1 decimal |
| Redness | % | 1 decimal |
| Exudate/Pus | % | 1 decimal |
| Trajectory | cm² per day | 1 decimal |
