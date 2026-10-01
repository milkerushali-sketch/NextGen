from fastapi import FastAPI

from .agent import run_agent
from .schemas import AgentRequest, AgentResponse

app = FastAPI(title="NovaCart AI Service", version="1.0.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-service"}


@app.post("/agent/query", response_model=AgentResponse)
def query_agent(request: AgentRequest) -> AgentResponse:
    return run_agent(request)

