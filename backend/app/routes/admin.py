from fastapi import APIRouter, Depends, Query
from app.database import get_db
from app.auth import get_admin_user

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/scans")
async def list_all_scans(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    scan_type: str = Query(None),
    prediction: str = Query(None),
    admin=Depends(get_admin_user),
):
    db = get_db()
    query = {}
    if scan_type:
        query["scan_type"] = scan_type
    if prediction:
        query["prediction"] = prediction

    skip = (page - 1) * limit
    total = await db.scans.count_documents(query)
    cursor = db.scans.find(query, sort=[("created_at", -1)], skip=skip, limit=limit)

    scans = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        if doc.get("created_at"):
            doc["created_at"] = doc["created_at"].isoformat()
        scans.append(doc)

    return {"total": total, "page": page, "limit": limit, "scans": scans}


@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin=Depends(get_admin_user),
):
    db = get_db()
    skip = (page - 1) * limit
    total = await db.users.count_documents({})
    cursor = db.users.find({}, {"password_hash": 0}, skip=skip, limit=limit)

    users = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        if doc.get("created_at"):
            doc["created_at"] = doc["created_at"].isoformat()
        # Attach scan count
        scan_count = await db.scans.count_documents({"user_id": doc["id"]})
        doc["scan_count"] = scan_count
        users.append(doc)

    return {"total": total, "page": page, "limit": limit, "users": users}


@router.get("/stats")
async def admin_stats(admin=Depends(get_admin_user)):
    db = get_db()
    total_scans = await db.scans.count_documents({})
    total_users = await db.users.count_documents({})
    phishing = await db.scans.count_documents({"prediction": "Phishing"})
    suspicious = await db.scans.count_documents({"prediction": "Suspicious"})
    safe = await db.scans.count_documents({"prediction": "Safe"})

    return {
        "total_scans": total_scans,
        "total_users": total_users,
        "phishing_count": phishing,
        "suspicious_count": suspicious,
        "safe_count": safe,
    }


@router.delete("/scans/{scan_id}")
async def delete_scan(scan_id: str, admin=Depends(get_admin_user)):
    from bson import ObjectId
    db = get_db()
    result = await db.scans.delete_one({"_id": ObjectId(scan_id)})
    if result.deleted_count == 0:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"message": "Scan deleted"}
