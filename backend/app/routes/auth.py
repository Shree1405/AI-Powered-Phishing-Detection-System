from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.database import get_db
from app.models import UserRegister, UserLogin, TokenResponse
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "role": user.get("role", "user"),
    }


@router.post("/register", status_code=201)
async def register(data: UserRegister):
    db = get_db()
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "username": data.username,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(result.inserted_id)})
    return TokenResponse(access_token=token, user=serialize_user(user_doc))


@router.post("/login")
async def login(data: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user["_id"])})
    return TokenResponse(access_token=token, user=serialize_user(user))


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return serialize_user(current_user)
