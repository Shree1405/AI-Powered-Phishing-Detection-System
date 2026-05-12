from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import connect_db, close_db
from app.config import FRONTEND_URL
from app.routes import auth, scan, dashboard, admin, report


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="PhishGuard API",
    description="AI-Powered Phishing Detection System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(scan.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(report.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "PhishGuard API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
