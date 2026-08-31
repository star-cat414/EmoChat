import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import analytics, emotion, voice
from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("emochat")

APP_VERSION = "1.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Model data is loaded once at startup (not per request).
    from app.models.emotion_model import EmotionModel

    app.state.emotion_model = EmotionModel()
    logger.info("Emotion model loaded: %s", app.state.emotion_model.model_name)
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="EmoChat Backend",
    version=APP_VERSION,
    description="N-Gram + HMM emotion intelligence for EmoChat",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGIN,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(emotion.router, prefix="/api", tags=["emotion"])
app.include_router(voice.router, prefix="/api", tags=["voice"])
app.include_router(analytics.router, prefix="/api", tags=["analytics"])


@app.get("/", include_in_schema=False)
def root():
    return {"status": "ok", "service": "emochat-backend"}


@app.get("/health", tags=["health"])
def health():
    return {
        "status": "ok",
        "service": "emochat-backend",
        "version": APP_VERSION,
        "supabase_configured": settings.supabase_configured,
    }
