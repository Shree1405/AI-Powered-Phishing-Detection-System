from fastapi import APIRouter, Depends
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])

    total = await db.scans.count_documents({"user_id": user_id})
    threats = await db.scans.count_documents({"user_id": user_id, "prediction": {"$in": ["Phishing", "Suspicious"]}})
    safe = await db.scans.count_documents({"user_id": user_id, "prediction": "Safe"})
    url_scans = await db.scans.count_documents({"user_id": user_id, "scan_type": "url"})
    email_scans = await db.scans.count_documents({"user_id": user_id, "scan_type": "email"})

    # Recent 10 scans
    cursor = db.scans.find({"user_id": user_id}, sort=[("created_at", -1)], limit=10)
    recent = []
    async for doc in cursor:
        recent.append({
            "id": str(doc["_id"]),
            "scan_type": doc.get("scan_type"),
            "target": doc.get("target", "")[:80],
            "prediction": doc.get("prediction"),
            "risk_score": doc.get("risk_score", 0),
            "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None,
        })

    # Chart data: last 7 days breakdown
    from datetime import datetime, timedelta, timezone
    chart_labels = []
    chart_safe = []
    chart_threats = []
    for i in range(6, -1, -1):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        label = day.strftime("%b %d")
        start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        end = day.replace(hour=23, minute=59, second=59)
        day_safe = await db.scans.count_documents({
            "user_id": user_id, "prediction": "Safe",
            "created_at": {"$gte": start, "$lte": end}
        })
        day_threat = await db.scans.count_documents({
            "user_id": user_id, "prediction": {"$in": ["Phishing", "Suspicious"]},
            "created_at": {"$gte": start, "$lte": end}
        })
        chart_labels.append(label)
        chart_safe.append(day_safe)
        chart_threats.append(day_threat)

    return {
        "total_scans": total,
        "threat_count": threats,
        "safe_count": safe,
        "url_scans": url_scans,
        "email_scans": email_scans,
        "recent_scans": recent,
        "chart_data": {
            "labels": chart_labels,
            "safe": chart_safe,
            "threats": chart_threats,
        },
    }
