# Artha AI — Your AI Financial Advisor

A full-stack AI-powered financial advisory application that generates personalized wealth plans based on your risk profile. Built for the Indian financial ecosystem.

## Architecture

```
Artha AI/
├── backend/                  # FastAPI + Python
│   ├── main.py              # API entry-point & CORS config
│   ├── risk_engine.py       # Pydantic schemas + scoring logic
│   ├── llm_service.py       # Gemini API integration (Artha persona)
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment template
│
└── frontend/                 # React + Vite + Tailwind CSS v4
    ├── src/
    │   ├── App.jsx           # State machine & API orchestration
    │   ├── components/
    │   │   ├── QuestionForm.jsx   # Multi-step quiz (15 questions)
    │   │   └── PlanDisplay.jsx    # Markdown plan renderer
    │   ├── data/
    │   │   └── questions.js       # 15 financial health questions
    │   ├── index.css              # Design system (dark theme)
    │   └── main.jsx               # React entry-point
    └── index.html                 # HTML shell with SEO
```

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env           # Add your GEMINI_API_KEY
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:8000`.

## How It Works

1. **Quiz** — User answers 15 financial health questions (one at a time).
2. **Risk Engine** — Backend scores answers (15–45), classifies risk tier (Conservative / Moderate / Aggressive), and checks critical flags (no insurance, high debt).
3. **AI Plan** — Gemini generates a personalized wealth plan via the "Artha" persona with guardrails for Indian financial products, insurance mandates, and debt clearance.
4. **Display** — Frontend renders the Markdown plan with score visualization, flag alerts, and styled typography.

## Tech Stack

- **Backend**: FastAPI, Pydantic, Google GenAI SDK
- **Frontend**: React 19, Vite, Tailwind CSS v4, react-markdown
