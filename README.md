# PhishGuard — AI-Powered Phishing Detection System

A full-stack cybersecurity application that detects phishing URLs and suspicious email content using machine learning.

## Architecture

```
Browser → React Frontend (Vite + Tailwind)
              ↓ REST API
         FastAPI Backend
              ↓
    ┌─────────────────────┐
    │  ML Engine          │  Random Forest (scikit-learn)
    │  Email Analyzer     │  Rule-based NLP
    │  MongoDB            │  Scan history & users
    │  VirusTotal API     │  Optional threat intel
    └─────────────────────┘
```

## Features

- **URL Scanner** — ML-based phishing detection with 22 extracted features
- **Email Scanner** — Rule-based analysis for urgency, fake links, sensitive data requests
- **Dashboard** — Real-time stats, area chart, pie chart, recent scans
- **Threat Intel** — VirusTotal integration for domain reputation
- **Scan History** — Full history with PDF export
- **Admin Panel** — User management, scan monitoring, delete scans
- **JWT Auth** — Secure login/register with bcrypt passwords

## Quick Start

### 1. Train the ML model

```bash
python3 phishing-detector/dataset/generate_dataset.py
python3 phishing-detector/ml-model/train_model.py
```

### 2. Backend

```bash
cd phishing-detector/backend
pip install -r requirements.txt
cp .env.example .env          # edit as needed
uvicorn app.main:app --reload --port 8000
```

Requires MongoDB running locally: `mongod` or use MongoDB Atlas (update MONGODB_URL in .env).

### 3. Frontend

```bash
cd phishing-detector/frontend
npm install
npm run dev
```

Open http://localhost:5173

## Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| MONGODB_URL | MongoDB connection string |
| JWT_SECRET | Long random secret for JWT signing |
| VIRUSTOTAL_API_KEY | Optional — get free key at virustotal.com |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/v1/auth/register | Register user |
| POST | /api/v1/auth/login | Login |
| GET | /api/v1/auth/me | Current user |
| POST | /api/v1/scan/url | Scan a URL |
| POST | /api/v1/scan/email | Scan email content |
| GET | /api/v1/scan/history | User scan history |
| GET | /api/v1/dashboard/stats | Dashboard data |
| GET | /api/v1/admin/scans | All scans (admin) |
| GET | /api/v1/admin/users | All users (admin) |
| DELETE | /api/v1/admin/scans/{id} | Delete scan (admin) |
| GET | /api/v1/report/scan/{id}/pdf | Export PDF |

## Example API Responses

### POST /api/v1/scan/url
```json
{
  "url": "http://paypal-secure-login.xyz/verify",
  "prediction": "Phishing",
  "confidence": 0.97,
  "risk_score": 97,
  "features": {
    "url_length": 38,
    "has_https": 0,
    "has_ip": 0,
    "num_dots": 2,
    "num_hyphens": 2,
    "num_subdomains": 1,
    "has_suspicious_keywords": 1,
    "suspicious_keyword_count": 2,
    "url_entropy": 3.91,
    "num_at_signs": 0,
    "prefix_suffix_domain": 1
  },
  "virustotal": null,
  "scan_id": "664abc123def456"
}
```

### POST /api/v1/scan/email
```json
{
  "prediction": "Phishing",
  "risk_percentage": 85,
  "detected_patterns": [
    "Urgency language: 'urgent'",
    "Phishing keyword: 'verify your account'",
    "Suspicious URL pattern detected",
    "Requests sensitive data: 'password'"
  ],
  "explanation": "Detected 4 suspicious indicator(s). Risk score: 85/100.",
  "scan_id": "664abc789def012"
}
```

## Database Schema (MongoDB)

### users collection
```json
{
  "_id": "ObjectId",
  "username": "string",
  "email": "string",
  "password_hash": "bcrypt string",
  "role": "user | admin",
  "created_at": "datetime"
}
```

### scans collection
```json
{
  "_id": "ObjectId",
  "scan_type": "url | email",
  "target": "string",
  "prediction": "Safe | Suspicious | Phishing",
  "confidence": 0.97,
  "risk_score": 97,
  "features": {},
  "virustotal": {},
  "detected_patterns": [],
  "explanation": "string",
  "user_id": "string",
  "username": "string",
  "created_at": "datetime"
}
```

## Creating an Admin User

After registering normally, update the role in MongoDB:
```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

## Security Best Practices

- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens expire after 60 minutes
- Input validation on all endpoints via Pydantic
- CORS restricted to frontend origin
- No raw SQL — MongoDB with parameterized queries
- Secrets in environment variables, never in code

## Deployment

### Backend (e.g. Railway / Render)
```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Frontend (e.g. Vercel / Netlify)
```bash
npm run build
# deploy dist/ folder
# set VITE_API_URL env var if backend is on a different domain
```

Update `vite.config.js` proxy or use `VITE_API_BASE_URL` for production.
