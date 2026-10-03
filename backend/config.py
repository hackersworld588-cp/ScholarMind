import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
EXPORTS_DIR = STORAGE_DIR / "exports"
DB_PATH = STORAGE_DIR / "scholarmind.db"

# Ensure directories exist
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Application Defaults
DEFAULT_LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")  # "gemini", "openai", "anthropic", "local_deterministic"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "gemini-1.5-flash")
DEFAULT_CITATION_STYLE = "vancouver"  # vancouver, apa, harvard, ieee
DEFAULT_LANGUAGE = "English (US Academic)"
DEFAULT_PAGE_SIZE = "A4"
DEFAULT_TARGET_WORD_COUNT = 5000
