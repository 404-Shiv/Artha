"""
Artha LLM Service
------------------
Bridges the risk engine output to the Google Gemini API.
Uses the "Artha" persona — a warm, encouraging Indian financial advisor.
Returns structured JSON output from Gemini for reliable frontend rendering.
Includes a summarizer agent to condense detailed plans into short notes.
"""

import os
import re
import json
import logging
import unicodedata
import asyncio
from typing import Optional
from google import genai
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pydantic models for structured Gemini JSON output
# ---------------------------------------------------------------------------

class FinancialMatrixRow(BaseModel):
    metric_area: str = Field(description="Name of the financial metric (e.g. Insurance Adequacy, Debt-to-Savings Ratio)")
    estimated_ratio: str = Field(description="The estimated ratio/percentage as a string (e.g. '85%')")
    advisory_status: str = Field(description="One of: Critical Gap, Needs Restructuring, Balanced, Optimum")


class TacticalDirective(BaseModel):
    title: str = Field(description="Short title for the directive")
    description: str = Field(description="Detailed actionable description of the directive")


class AssetAllocationRow(BaseModel):
    asset_category: str = Field(description="Name of the asset category")
    target_allocation: str = Field(description="Target allocation percentage (e.g. '40%')")
    instrument_vehicle: str = Field(description="SEBI-regulated instrument vehicle")
    rationale: str = Field(description="Brief rationale for this allocation")


class ExecutiveSummaryRow(BaseModel):
    variable: str = Field(description="Plan variable name")
    recommendation: str = Field(description="Advisory recommendation value")


class ArthaFinancialPlan(BaseModel):
    quick_take: str = Field(description="Personalized greeting starting with 'Vannakam, my dear chief!' followed by 2-3 sentences analyzing risk score and financial standing")
    financial_matrix: list[FinancialMatrixRow] = Field(description="5 rows covering Insurance Adequacy, Debt-to-Savings Ratio, Monthly Allocation Surplus, Investment Horizon Alignment, Liquidity Buffer")
    tactical_directives: list[TacticalDirective] = Field(description="2-3 specific actionable tasks based on identified flags")
    asset_allocation: list[AssetAllocationRow] = Field(description="5-6 rows of target asset allocation tailored to the risk tier")
    sip_note: str = Field(description="Brief note on the statistical advantage of SIP over lump-sum in volatile Indian markets")
    roadmap_1_year: list[str] = Field(description="1-year financial goals as brief bullet points")
    roadmap_3_year: list[str] = Field(description="3-year financial goals as brief bullet points")
    risk_warnings: list[str] = Field(description="3-4 specific behavioral risk notes matching the profile")
    executive_summary: list[ExecutiveSummaryRow] = Field(description="7 rows: Risk Score, Risk Classification, Primary Action Item, Recommended SIP Outlay, Equity to Debt Ratio, Year 1 Milestone Target, Year 3 Milestone Target")
    closing_counsel: str = Field(description="Final warm motivational note, 2-3 sentences max")


# ---------------------------------------------------------------------------
# Emoji / symbol stripper (LLMs often ignore "no emoji" instructions)
# ---------------------------------------------------------------------------

def _strip_emojis(text: str) -> str:
    """Remove all emoji and unicode symbols from text."""
    cleaned = []
    for c in text:
        cat = unicodedata.category(c)
        # So: Symbol, Other (covers emojis, flags, symbols, pictographs)
        # Sk: Symbol, Modifier (covers emoji skin tones/modifiers)
        if cat in ('So', 'Sk'):
            continue
        # Strip variation selectors and zero-width joiners
        codepoint = ord(c)
        if 0xFE00 <= codepoint <= 0xFE0F or codepoint == 0x200D or 0xE0100 <= codepoint <= 0xE01EF:
            continue
        cleaned.append(c)
    return "".join(cleaned)

# ---------------------------------------------------------------------------
# Gemini client (initialized lazily on first call)
# ---------------------------------------------------------------------------

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    """Return a cached Gemini client, creating one on first use."""
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY environment variable is not set. "
                "Please add it to your .env file."
            )
        _client = genai.Client(api_key=api_key)
    return _client


# ---------------------------------------------------------------------------
# System prompt — generates the DETAILED version only
# ---------------------------------------------------------------------------

SYSTEM_INSTRUCTION = """\
You are Artha AI, a proprietary wealth planning engine. You produce structured JSON output that reads like a bespoke, professional wealth advisory document prepared by a premier Indian private wealth firm.

### Style & Tone Guardrails
- **No Conversational Openings**: Do NOT write any generic conversational introductions or acknowledgements.
- **Greeting**: The quick_take field must begin with exactly: "Vannakam, my dear chief!" — never use "Namaste" or "Hello".
- **Tone**: Deeply analytical, encouraging, and clear. Speak like a highly experienced private banker who understands Indian tax codes and savings vehicles.
- **No Unicode Emojis/Symbols**: Absolutely NO icons, flags, warnings, checkmarks, or emoji characters. Keep it clean and typographical.
- All monetary metrics must be in Indian Rupees (INR) using standard lakh/crore naming where appropriate.

### Required JSON Structure
Return a JSON object matching the provided schema with these sections:

1. **quick_take**: Start with "Vannakam, my dear chief!" followed by 2-3 sentences of personalized analysis of their risk score and financial standing. Focus on encouraging what they are doing right.

2. **financial_matrix**: Exactly 5 rows covering: Insurance Adequacy, Debt-to-Savings Ratio, Monthly Allocation Surplus, Investment Horizon Alignment, Liquidity Buffer. Statuses: "Critical Gap", "Needs Restructuring", "Balanced", or "Optimum".

3. **tactical_directives**: 2-3 specific actionable directives based on flags.
   - If "no_insurance" flagged: Mandate term life (10x income) + health cover (min 10L) before any market SIPs.
   - If "high_debt" flagged: Suspend equity, clear high-interest liabilities (>15%) via avalanche method.
   - If no flags: Standard portfolio optimization.

4. **asset_allocation**: 5-6 rows tailored to risk tier:
   - Conservative: Liquid Funds, overnight debt, short duration bonds, banking & PSU debt, conservative hybrid.
   - Moderate: Nifty index funds, Flexi-cap, balanced advantage, aggressive hybrid, gold ETFs.
   - Aggressive: Core Nifty index, Next 50 mid-cap, small-cap funds, international feeder funds.

5. **sip_note**: Brief note on statistical advantage of SIP over lump-sum in volatile Indian markets.

6. **roadmap_1_year** and **roadmap_3_year**: Brief bullet points for 1-year and 3-year goals.

7. **risk_warnings**: 3-4 specific behavioral risk notes (e.g. panic-selling for aggressive, inflation erosion for conservative).

8. **executive_summary**: 7 rows: Risk Score (X/45), Risk Classification, Primary Action Item, Recommended SIP Outlay, Equity to Debt Ratio, Year 1 Milestone, Year 3 Milestone.

9. **closing_counsel**: Final warm motivational note (2-3 sentences).
"""


# ---------------------------------------------------------------------------
# Summarizer agent prompt
# ---------------------------------------------------------------------------

SUMMARIZER_INSTRUCTION = """\
You are a concise financial report summarizer. Your job is to take a detailed financial plan and condense it into a short, scannable summary.

### Rules
- Keep the output under 250 words.
- NO emojis, NO icons, NO symbols. Plain text only.
- Preserve all Markdown tables exactly — but reduce rows in the allocation table if needed.
- Use the SAME warm tone as the original (keep "Vannakam, my dear chief!" greeting).

### Output Format
Return ONLY these sections:

1. **Hello & Quick Take** — Condense the greeting to 1-2 lines max.

2. **Proprietary Financial Matrix** — Keep the exact same table from the original.

3. **Strategic Asset Weight Allocation** — Keep only the top 3 most important rows from the allocation table.

4. **Plan Executive Summary** — Keep the exact same summary table from the original.

5. **Closing Counsel** — Keep just one short motivational sentence.

Remove all other sections. Do NOT add any new content. Only condense what exists.
"""


# ---------------------------------------------------------------------------
# Helper for calling Gemini with retry and fallback
# ---------------------------------------------------------------------------

async def _generate_content_with_retry_and_fallback(
    contents: str,
    config: genai.types.GenerateContentConfig,
    primary_model: str = "gemini-2.5-flash",
    fallback_models: tuple = ("gemini-2.0-flash", "gemini-1.5-flash-8b", "gemini-1.5-flash", "gemini-2.5-pro", "gemini-1.5-pro"),
    max_retries: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0
):
    """
    Generate content with exponential backoff on transient errors
    and fall back to alternative models if the primary model fails.
    """
    client = _get_client()
    models_to_try = [primary_model] + list(fallback_models)
    last_exception = None

    for model in models_to_try:
        delay = initial_delay
        for attempt in range(max_retries):
            try:
                logger.info(f"Generating content with model '{model}' (attempt {attempt + 1}/{max_retries})...")
                response = await client.aio.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config,
                )
                return response
            except Exception as exc:
                last_exception = exc
                exc_str = str(exc).lower()

                # Transient errors: 503 Service Unavailable, 429 Too Many Requests, Resource Exhausted, Rate limits
                is_transient = any(
                    indicator in exc_str
                    for indicator in ("503", "unavailable", "429", "resource_exhausted", "exhausted", "limit", "demand", "overload")
                )

                if is_transient and attempt < max_retries - 1:
                    logger.warning(
                        f"Transient error with model '{model}' (attempt {attempt + 1}): {exc}. "
                        f"Retrying in {delay}s..."
                    )
                    await asyncio.sleep(delay)
                    delay *= backoff_factor
                else:
                    logger.error(f"Failed model '{model}' with error: {exc}. Moving on...")
                    break

    if last_exception:
        raise last_exception
    raise RuntimeError("Gemini content generation failed with no exception caught.")


# Public API
# ---------------------------------------------------------------------------

async def generate_financial_plan(
    risk_data: dict,
    user_answers: dict,
) -> dict:
    """
    Call Gemini to generate a personalised wealth plan as structured JSON.

    Parameters
    ----------
    risk_data : dict
        Must contain keys: score, risk_tier, flags.
    user_answers : dict
        The raw q1-q15 answers for additional context.

    Returns
    -------
    dict
        Structured financial plan with sections:
        quick_take, financial_matrix, tactical_directives,
        asset_allocation, sip_note, roadmap_1_year, roadmap_3_year,
        risk_warnings, executive_summary, closing_counsel.
    """

    score = risk_data["score"]
    risk_tier = risk_data["risk_tier"]
    flags = risk_data.get("flags", [])

    user_prompt = (
        f"Here is my financial profile:\n"
        f"- Risk Score: {score}/45\n"
        f"- Risk Tier: {risk_tier}\n"
        f"- Critical Flags: {', '.join(flags) if flags else 'None'}\n"
        f"- Raw Answers: {user_answers}\n\n"
        f"Based on this, generate my complete personalised wealth plan as structured JSON."
    )

    try:
        response = await _generate_content_with_retry_and_fallback(
            contents=user_prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.7,
                max_output_tokens=4096,
                response_mime_type="application/json",
                response_schema=ArthaFinancialPlan,
            ),
        )

        raw_text = response.text or "{}"
        plan_data = json.loads(raw_text)

        # Strip emojis from all string values recursively
        plan_data = _strip_emojis_from_data(plan_data)

        return plan_data

    except Exception as exc:
        logger.exception("Gemini API call failed")
        raise exc


def _strip_emojis_from_data(data):
    """Recursively strip emojis from all string values in a nested structure."""
    if isinstance(data, str):
        return _strip_emojis(data)
    elif isinstance(data, list):
        return [_strip_emojis_from_data(item) for item in data]
    elif isinstance(data, dict):
        return {key: _strip_emojis_from_data(value) for key, value in data.items()}
    return data


async def summarize_plan(full_plan: str) -> str:
    """
    AI Filtering Agent — condense a detailed plan into a short summary.

    Parameters
    ----------
    full_plan : str
        The full detailed Markdown plan to summarize.

    Returns
    -------
    str
        A condensed Markdown summary (~150-200 words).
    """

    user_prompt = (
        "Here is the detailed financial plan. "
        "Please condense it into a short, scannable summary:\n\n"
        f"{full_plan}"
    )

    try:
        response = await _generate_content_with_retry_and_fallback(
            contents=user_prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction=SUMMARIZER_INSTRUCTION,
                temperature=0.3,
                max_output_tokens=1024,
            ),
        )
        raw = response.text or "_Could not generate summary. Please try again._"
        return _strip_emojis(raw)

    except Exception as exc:
        logger.exception("Summarizer API call failed")
        raise exc
