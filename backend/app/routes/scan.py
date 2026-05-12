from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
import httpx

from app.database import get_db
from app.models import URLScanRequest, URLScanResponse, EmailScanRequest, EmailScanResponse, URLFeatures
from app.auth import get_current_user
from app.ml_engine import predict_url, analyze_email
from app.config import VIRUSTOTAL_API_KEY

router = APIRouter(prefix="/scan", tags=["Scanning"])


async def virustotal_lookup(url: str) -> dict | None:
    """Query VirusTotal API for URL reputation."""
    if not VIRUSTOTAL_API_KEY:
        return None
    try:
        import base64
        url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"https://www.virustotal.com/api/v3/urls/{url_id}",
                headers={"x-apikey": VIRUSTOTAL_API_KEY},
            )
            if resp.status_code == 200:
                data = resp.json()
                stats = data["data"]["attributes"]["last_analysis_stats"]
                return {
                    "malicious": stats.get("malicious", 0),
                    "suspicious": stats.get("suspicious", 0),
                    "harmless": stats.get("harmless", 0),
                    "undetected": stats.get("undetected", 0),
                    "reputation": data["data"]["attributes"].get("reputation", 0),
                }
    except Exception:
        pass
    return None


@router.post("/url", response_model=URLScanResponse)
async def scan_url(
    request: URLScanRequest,
    current_user: dict = Depends(get_current_user),
):
    url = request.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")

    prediction, confidence, risk_score, features = predict_url(url)
    vt_result = await virustotal_lookup(url)

    # Persist scan
    db = get_db()
    scan_doc = {
        "scan_type": "url",
        "target": url[:500],
        "prediction": prediction,
        "confidence": confidence,
        "risk_score": risk_score,
        "features": features,
        "virustotal": vt_result,
        "user_id": str(current_user["_id"]),
        "username": current_user["username"],
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.scans.insert_one(scan_doc)

    return URLScanResponse(
        url=url,
        prediction=prediction,
        confidence=round(confidence, 4),
        risk_score=risk_score,
        features=URLFeatures(**{k: features[k] for k in URLFeatures.model_fields}),
        virustotal=vt_result,
        scan_id=str(result.inserted_id),
    )


@router.post("/email", response_model=EmailScanResponse)
async def scan_email(
    request: EmailScanRequest,
    current_user: dict = Depends(get_current_user),
):
    prediction, risk_percentage, detected_patterns, explanation = analyze_email(request.content)

    db = get_db()
    scan_doc = {
        "scan_type": "email",
        "target": request.content[:200] + "..." if len(request.content) > 200 else request.content,
        "prediction": prediction,
        "confidence": risk_percentage / 100,
        "risk_score": risk_percentage,
        "detected_patterns": detected_patterns,
        "explanation": explanation,
        "user_id": str(current_user["_id"]),
        "username": current_user["username"],
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.scans.insert_one(scan_doc)

    return EmailScanResponse(
        prediction=prediction,
        risk_percentage=risk_percentage,
        detected_patterns=detected_patterns,
        explanation=explanation,
        scan_id=str(result.inserted_id),
    )


@router.get("/history")
async def get_scan_history(
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    cursor = db.scans.find(
        {"user_id": str(current_user["_id"])},
        sort=[("created_at", -1)],
        limit=limit,
    )
    scans = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        scans.append(doc)
    return {"scans": scans}
