# EmoChat

**Chat normally. Understand emotions intelligently.**

A 1-to-1 real-time messaging web application (Telegram/Messenger-style) with built-in
emotion intelligence powered by custom **N-Gram language models** and **Hidden Markov
Models (HMM)**. Final Year NLP / IT project.

## Highlights

- 🔐 Supabase Auth (register / login / logout / forgot password / session)
- 💬 Real-time 1-to-1 messaging via **Supabase Realtime**
- 🔍 User search + find-or-create private conversations (no duplicates)
- 🧠 Emotion prediction with **N-Gram (Unigram/Bigram/Trigram + Laplace smoothing) + HMM**
- 🌏 First-class **Myanmar Unicode** support (plus English and mixed text)
- 😊 Expandable emotion cards on every analyzed message
- 📊 Conversation + per-person + personal emotion analytics (Recharts)
- 🎤 Voice messages (MediaRecorder → Supabase Storage → Whisper STT → N-Gram + HMM)
- 📞 WebRTC audio calls with periodic emotion analysis + timeline

## Architecture

```
Browser (Next.js App Router + TS + Tailwind v4)
   │  Supabase Realtime (message push)
   ▼
Supabase (Auth + Postgres + RLS + Storage + Realtime)
   ▲
   │  public/anon key (never the service-role key)
   ▼
FastAPI (Python) — N-Gram + HMM emotion engine, Whisper STT
```

**Key rule:** message sending is fully independent of the NLP service. If FastAPI is
down, messages still send — emotion analysis simply shows "temporarily unavailable."

## Repository layout

```
frontend/   Next.js 16 + TypeScript + Tailwind v4 (Vercel)
backend/    FastAPI + Python (Render)
supabase/   SQL migrations (tables, RLS, RPC, storage, realtime)
```

---

## Setup

### 1. Create a Supabase project

1. Go to https://supabase.com → New project.
2. Note your project URL and keys (Settings → API):
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (anon/public — safe for frontend)
   - `SUPABASE_SERVICE_ROLE_KEY` (service role — **backend only**, never expose publicly)
3. Run the schema: open **SQL Editor** and paste the contents of
   `supabase/migrations/0001_init.sql` → Run.
   (Or use `supabase db push` if you have the Supabase CLI + linked project.)

### 2. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt

# Copy env file, then fill in values
cp .env.example .env

uvicorn app.main:app --reload --port 8000
```

`.env`:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ALLOWED_ORIGIN=http://localhost:3000
OPENAI_API_KEY=sk-...   # for voice speech-to-text (Whisper API)
```

Verify: `GET http://localhost:8000/health` → `{"status":"ok"}`.

### 3. Frontend (Next.js)

```bash
cd frontend
npm install

# Copy env file, then fill in values
copy .env.example .env.local

npm run dev
```

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Open http://localhost:3000.

---

## Demonstration flow (for presentation)

1. Register two accounts (e.g. `alice`, `bob`).
2. Alice uses **New Chat** → searches `bob` → starts a private chat.
3. Alice sends: `ဒီနေ့ အရမ်းပျော်တယ် 😍`
4. The message appears instantly; FastAPI analyzes it in the background.
5. A compact **😊 Happy — 84%** card appears; click to expand all 6 probabilities.
6. Send a few messages with different emotions (happy / sad / angry / neutral).
7. Open **Conversation → Analytics**: emotion distribution donut + trend chart.
8. Send a **voice message** → transcript + emotion appear on the bubble.
9. Start a **voice call** → live current emotion + emotion timeline update periodically.

## N-Gram + HMM (academic summary)

- **N-Gram** (`backend/app/models/ngram.py`): Unigram `P(w)`, Bigram `P(w|prev)`,
  Trigram `P(w|prev2,prev)` with **add-one (Laplace) smoothing**. A model is trained per
  emotion class; an input message is scored by its (log) likelihood under each class.
- **HMM** (`backend/app/models/hmm.py`): 6 hidden states (Happy/Sad/Angry/Fear/
  Surprise/Neutral). Models **emotional context between consecutive messages** with
  initial, transition, and emission (message n-gram likelihood) probabilities. Forward
  algorithm produces the posterior over the current message's emotion; Viterbi decodes the
  most likely emotion sequence.
- **Pipeline** (`backend/app/models/emotion_model.py`):
  `Text → Language detection → Preprocessing (Myanmar unicode) → Tokenization →
  N-Gram scores → HMM context → normalize → 6 probabilities`.
- Model is trained **once at startup** from `backend/app/data/emotion_dataset/` and cached.

The dev-only model evaluation page (`POST /api/model/evaluate`, and the frontend
`/dev/model-eval` page) reports accuracy/precision/recall/F1, a confusion matrix, and
English-vs-Myanmar performance.

## Security notes

- The **service-role key lives only in the backend** `.env`. The frontend uses the public
  anon key.
- Row Level Security is enabled on every table; users can only read conversations they
  belong to, read/insert messages in their conversations, and update their own profile.
- Storage buckets `avatars` and `voice-messages` are scoped per-user.

## Deployment

### Vercel (frontend)
- Import the `frontend/` directory as a Vercel project.
- Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_API_URL`.

### Render (backend)
- Import `backend/` as a **Web Service**.
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Set env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `ALLOWED_ORIGIN=https://<your-vercel-app>.vercel.app`, `OPENAI_API_KEY`.
- Update the frontend's `NEXT_PUBLIC_API_URL` to the Render URL.
