"""
Artha — FastAPI Backend
-----------------------
Single entry-point for the financial advisory API.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from risk_engine import QuizAnswers, evaluate
from llm_service import generate_financial_plan, summarize_plan

# Load .env for GEMINI_API_KEY
load_dotenv()

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Artha API",
    description="Artha AI — personalised financial advisory engine",
    version="1.0.0",
)

# CORS — allow the React dev server and any origin during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

from pydantic import BaseModel


class SummarizeRequest(BaseModel):
    """Request body for the summarize endpoint."""
    plan: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
async def health():
    """Simple health-check."""
    return {"status": "ok", "service": "Artha API"}


@app.post("/api/evaluate")
async def evaluate_risk(answers: QuizAnswers):
    """
    Accept 15 quiz answers, compute the risk profile,
    call Gemini for a personalised plan, and return everything.

    Response shape (JSON):
    {
        "score": 38,
        "risk_tier": "Aggressive",
        "flags": ["no_insurance", "high_debt"],
        "plan": {
            "quick_take": "Vannakam, my dear chief! ...",
            "financial_matrix": [...],
            "tactical_directives": [...],
            "asset_allocation": [...],
            "sip_note": "...",
            "roadmap_1_year": [...],
            "roadmap_3_year": [...],
            "risk_warnings": [...],
            "executive_summary": [...],
            "closing_counsel": "..."
        }
    }
    """

    # 1. Run the risk engine
    result = evaluate(answers)

    # 2. Generate the AI financial plan (structured JSON)
    risk_data = {
        "score": result.score,
        "risk_tier": result.risk_tier,
        "flags": result.flags,
    }
    user_answers = answers.model_dump()

    try:
        plan = await generate_financial_plan(risk_data, user_answers)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Gemini API error: {exc}"
        )

    # 3. Return combined response with structured plan
    return {
        "score": result.score,
        "risk_tier": result.risk_tier,
        "flags": result.flags,
        "plan": plan,
    }


@app.post("/api/summarize")
async def summarize(req: SummarizeRequest):
    """
    AI Filtering Agent — condense a detailed plan into a short summary.

    Request:  { "plan": "...full markdown or JSON text..." }
    Response: { "short_plan": "...condensed markdown..." }
    """
    try:
        short = await summarize_plan(req.plan)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Summarizer API error: {exc}"
        )
    return {"short_plan": short}

