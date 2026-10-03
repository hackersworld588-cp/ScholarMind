import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.database import init_db
from backend.config import STORAGE_DIR
from backend.routers import projects, documents, outline, chapter, export, settings, synthesizer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("scholarmind.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ScholarMind AI Backend...")
    init_db()
    logger.info("Database verified and ready.")
    yield
    logger.info("Shutting down ScholarMind AI Backend.")

app = FastAPI(
    title="ScholarMind AI Backend",
    description="Intelligent Book Chapter Research & Authoring Agent API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - Allow local development, LAN mobile devices, and localhost
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Sample Images
samples_path = STORAGE_DIR / "sample_images"
samples_path.mkdir(parents=True, exist_ok=True)
app.mount("/static/samples", StaticFiles(directory=str(samples_path)), name="samples")

# Include Routers
app.include_router(synthesizer.router)
app.include_router(projects.router)
app.include_router(documents.router)
app.include_router(outline.router)
app.include_router(chapter.router)
app.include_router(export.router)
app.include_router(settings.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ScholarMind AI Engine",
        "version": "1.0.0",
        "database": "sqlite_wal"
    }

@app.get("/api/network-info")
def get_network_info():
    import socket
    import subprocess
    import re
    
    local_ip = "127.0.0.1"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.2)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass

    if local_ip.startswith("127."):
        try:
            out = subprocess.check_output(['ifconfig'], text=True)
            ips = re.findall(r'inet\s+(\d+\.\d+\.\d+\.\d+)', out)
            valid = [ip for ip in ips if not ip.startswith('127.') and not ip.startswith('169.254.')]
            if valid:
                local_ip = valid[0]
        except Exception:
            pass

    return {
        "local_ip": local_ip,
        "mobile_url": f"http://{local_ip}:3000",
        "api_url": f"http://{local_ip}:8000"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
