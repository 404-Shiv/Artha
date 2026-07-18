"""
Artha Risk Engine
-----------------
Evaluates 15 financial-health answers to produce a risk score, tier, and flags.
"""

from pydantic import BaseModel, Field
from typing import Literal


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class QuizAnswers(BaseModel):
    """Exactly 15 answers, each an integer 1-3."""

    q1:  int = Field(..., ge=1, le=3)
    q2:  int = Field(..., ge=1, le=3)
    q3:  int = Field(..., ge=1, le=3)
    q4:  int = Field(..., ge=1, le=3)
    q5:  int = Field(..., ge=1, le=3)
    q6:  int = Field(..., ge=1, le=3)
    q7:  int = Field(..., ge=1, le=3)
    q8:  int = Field(..., ge=1, le=3)
    q9:  int = Field(..., ge=1, le=3)
    q10: int = Field(..., ge=1, le=3)
    q11: int = Field(..., ge=1, le=3)
    q12: int = Field(..., ge=1, le=3)
    q13: int = Field(..., ge=1, le=3)
    q14: int = Field(..., ge=1, le=3)
    q15: int = Field(..., ge=1, le=3)


class RiskResult(BaseModel):
    """Returned by the evaluation endpoint."""

    score: int
    risk_tier: Literal["Conservative", "Moderate", "Aggressive"]
    flags: list[str]


# ---------------------------------------------------------------------------
# Core evaluation logic
# ---------------------------------------------------------------------------

def evaluate(answers: QuizAnswers) -> RiskResult:
    """
    Score the 15 answers, classify the risk tier, and flag critical issues.

    Scoring
    -------
    - Total score range: 15 (all 1s) to 45 (all 3s).
    - 15-25 → Conservative
    - 26-35 → Moderate
    - 36-45 → Aggressive

    Flags
    -----
    - q4 == 1  → "no_insurance"  (user has no health/life insurance)
    - q7 == 3  → "high_debt"     (user carries high-interest debt)
    """

    values = [
        answers.q1,  answers.q2,  answers.q3,  answers.q4,  answers.q5,
        answers.q6,  answers.q7,  answers.q8,  answers.q9,  answers.q10,
        answers.q11, answers.q12, answers.q13, answers.q14, answers.q15,
    ]

    score = sum(values)

    # --- Tier classification ---
    if score <= 25:
        risk_tier = "Conservative"
    elif score <= 35:
        risk_tier = "Moderate"
    else:
        risk_tier = "Aggressive"

    # --- Critical financial flags ---
    flags: list[str] = []

    if answers.q4 == 1:
        flags.append("no_insurance")

    if answers.q7 == 3:
        flags.append("high_debt")

    return RiskResult(score=score, risk_tier=risk_tier, flags=flags)
