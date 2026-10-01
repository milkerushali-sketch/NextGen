import hmac
import logging

from fastapi import Depends, FastAPI, Header, HTTPException, Request

from .agent import run_agent
from .config import configured_service_token
from .ml_predictor import predict
from .rag import index_policy, search_company_policy
from .schemas import (
    AgentRequest,
    AgentResponse,
    ClassifyRequest,
    PolicyIndexRequest,
    PolicySearchRequest,
)

logger = logging.getLogger("novacart.ai")
app = FastAPI(title="NovaCart AI Agent Service", version="2.0.0")


def require_internal_service(request: Request, x_ai_service_token: str | None = Header(default=None)) -> None:
    expected = configured_service_token()
    if expected:
        if not x_ai_service_token or not hmac.compare_digest(x_ai_service_token, expected):
            raise HTTPException(status_code=401, detail="Invalid AI service credentials.")
        return
    client_host = request.client.host if request.client else ""
    if client_host not in {"127.0.0.1", "::1", "localhost", "testclient"}:
        raise HTTPException(
            status_code=503,
            detail="Configure AI_SERVICE_TOKEN before exposing the AI service.",
        )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-service"}


@app.post("/agent/classify", dependencies=[Depends(require_internal_service)])
def classify(request: ClassifyRequest) -> dict[str, object]:
    prediction = predict(request.message)
    return {
        "intent": prediction["intent"],
        "intentConfidence": prediction["intentConfidence"],
        "priority": prediction["priority"],
        "sentiment": prediction["sentiment"],
        "modelAvailable": prediction["modelAvailable"],
        "confidenceSource": prediction["confidenceSource"],
    }


@app.post(
    "/agent/chat",
    response_model=AgentResponse,
    dependencies=[Depends(require_internal_service)],
)
@app.post(
    "/agent/query",
    response_model=AgentResponse,
    dependencies=[Depends(require_internal_service)],
    include_in_schema=False,
)
def chat(request: AgentRequest) -> AgentResponse:
    try:
        return run_agent(request)
    except (ValueError, PermissionError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        logger.exception("AI agent request failed")
        raise HTTPException(
            status_code=503,
            detail="The AI agent could not complete the request.",
        ) from error


@app.post("/rag/search", dependencies=[Depends(require_internal_service)])
def rag_search(request: PolicySearchRequest) -> dict[str, object]:
    try:
        return {"results": search_company_policy(request.query, request.limit)}
    except Exception as error:
        logger.exception("Policy search failed")
        raise HTTPException(
            status_code=503,
            detail="Policy search is not available. Apply the pgvector migration first.",
        ) from error


@app.post("/rag/index-policy", dependencies=[Depends(require_internal_service)])
def rag_index_policy(request: PolicyIndexRequest) -> dict[str, object]:
    try:
        return index_policy(request.title, request.policy_text)
    except Exception as error:
        logger.exception("Policy indexing failed")
        raise HTTPException(
            status_code=503,
            detail="Policy indexing is not available. Apply the pgvector migration first.",
        ) from error
