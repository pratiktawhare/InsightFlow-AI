from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import Base, engine
from api.meetings import router as meetings_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings_router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.api_version,
        "service": "InsightFlow AI API"
    }

@app.get("/")
async def root():
    return {"message": "InsightFlow AI API", "docs": "/docs"}
