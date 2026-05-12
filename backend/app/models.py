"""
Pydantic models for request/response validation and MongoDB schemas.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserOut(BaseModel):
    id: str
    username: str
    email: str
    role: str
    created_at: datetime


# ── URL Scan ──────────────────────────────────────────────────────────────────

class URLScanRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048)

class URLFeatures(BaseModel):
    url_length: int
    has_https: int
    has_ip: int
    num_dots: int
    num_hyphens: int
    num_subdomains: int
    has_suspicious_keywords: int
    suspicious_keyword_count: int
    url_entropy: float
    num_at_signs: int
    prefix_suffix_domain: int

class URLScanResponse(BaseModel):
    url: str
    prediction: str          # "Safe" | "Phishing"
    confidence: float        # 0.0 – 1.0
    risk_score: int          # 0 – 100
    features: URLFeatures
    virustotal: Optional[dict] = None
    scan_id: Optional[str] = None


# ── Email Scan ────────────────────────────────────────────────────────────────

class EmailScanRequest(BaseModel):
    content: str = Field(..., min_length=10, max_length=50000)

class EmailScanResponse(BaseModel):
    prediction: str          # "Safe" | "Suspicious" | "Phishing"
    risk_percentage: int     # 0 – 100
    detected_patterns: List[str]
    explanation: str
    scan_id: Optional[str] = None


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_scans: int
    threat_count: int
    safe_count: int
    url_scans: int
    email_scans: int
    recent_scans: List[dict]
    chart_data: dict


# ── Admin ─────────────────────────────────────────────────────────────────────

class ScanHistoryItem(BaseModel):
    id: str
    scan_type: str
    target: str
    prediction: str
    risk_score: int
    user_id: str
    username: str
    created_at: datetime
