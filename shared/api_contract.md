# API Contract

⚠️ **WARNING: This contract is LOCKED. Do not modify without team coordination.**

Frontend development depends on this exact structure.

---

## POST /api/v1/analyze

Analyze a wound image and return metrics.

### Request

```json
{
  "image_base64": "string (optional)",
  "use_demo_image": false
}
```

### Response

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

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `area_cm2` | float | Wound area in square centimeters |
| `redness_pct` | float | Percentage of wound showing redness (0-100) |
| `pus_pct` | float | Percentage of wound showing exudate/pus (0-100) |
| `risk_level` | string | One of: `GREEN`, `AMBER`, `RED` |
| `trajectory.expected` | float[] | Expected healing trajectory (area values) |
| `trajectory.actual` | float[] | Actual observed trajectory (area values) |
| `alert_reason` | string | Reason for alert (null if GREEN) |

---

## GET /health

Health check endpoint.

### Response

```json
{
  "status": "healthy",
  "demo_mode": true
}
```

---

## GET /

Root endpoint with API status.

### Response

```json
{
  "status": "running",
  "demo_mode": true,
  "api_docs": "/docs",
  "message": "Wound Monitoring API is running"
}
```

---

## Versioning

- Current API version: `v1`
- Base URL: `http://localhost:8000/api/v1`

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-01-31 | 0.1.0 | Initial contract locked |
