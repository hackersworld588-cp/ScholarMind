from fastapi import APIRouter
from backend.models.schemas import (
    SettingsRequest, SettingsResponse, TestConnectionRequest, TestConnectionResponse
)
from backend.services.llm_service import LLMService

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("", response_model=SettingsResponse)
def get_settings():
    provider = LLMService.get_setting("llm_provider", "gemini")
    gemini_key = LLMService.get_setting("gemini_api_key", "")
    openai_key = LLMService.get_setting("openai_api_key", "")
    anthropic_key = LLMService.get_setting("anthropic_api_key", "")
    model = LLMService.get_setting("default_model", "gemini-1.5-flash")
    citation_style = LLMService.get_setting("default_citation_style", "vancouver")
    language = LLMService.get_setting("default_language", "English (US Academic)")

    return SettingsResponse(
        llm_provider=provider,
        has_gemini_key=bool(gemini_key),
        has_openai_key=bool(openai_key),
        has_anthropic_key=bool(anthropic_key),
        default_model=model,
        default_citation_style=citation_style,
        default_language=language,
        available_providers=["gemini", "openai", "anthropic", "local_deterministic"]
    )

@router.put("", response_model=SettingsResponse)
def update_settings(req: SettingsRequest):
    LLMService.set_setting("llm_provider", req.llm_provider)
    if req.gemini_api_key is not None and req.gemini_api_key != "":
        LLMService.set_setting("gemini_api_key", req.gemini_api_key)
    if req.openai_api_key is not None and req.openai_api_key != "":
        LLMService.set_setting("openai_api_key", req.openai_api_key)
    if req.anthropic_api_key is not None and req.anthropic_api_key != "":
        LLMService.set_setting("anthropic_api_key", req.anthropic_api_key)
    if req.default_model:
        LLMService.set_setting("default_model", req.default_model)
    if req.default_citation_style:
        LLMService.set_setting("default_citation_style", req.default_citation_style)
    if req.default_language:
        LLMService.set_setting("default_language", req.default_language)

    return get_settings()

@router.post("/test-connection", response_model=TestConnectionResponse)
async def test_connection(req: TestConnectionRequest):
    api_key = req.api_key
    if not api_key:
        if req.provider == "gemini":
            api_key = LLMService.get_setting("gemini_api_key", "")
        elif req.provider == "openai":
            api_key = LLMService.get_setting("openai_api_key", "")
        elif req.provider == "anthropic":
            api_key = LLMService.get_setting("anthropic_api_key", "")

    result = await LLMService.test_connection(req.provider, api_key or "", req.model)
    return TestConnectionResponse(**result)
