---
marp: true
theme: default
paginate: true
# Export: npx @marp-team/marp-cli docs/emochat-presentation.md --pptx -o EmoChat.pptx
---

# EmoChat
## Emotions for every message

_Real-time chat + emotion intelligence for text & voice_

**Next.js 16 · Supabase · FastAPI · N-Gram · HMM · Whisper**

---

# The Problem

Chat apps deliver your **words** — but not your **feelings**.

- Same phrase can be happy, sarcastic, or angry
- Emotion is invisible in most messaging UIs
- Conversations carry **mood**, not just content

**EmoChat decodes how you feel while you chat.**

---

# Core Idea

Every message — text **and** voice — is analyzed in real time into **6 emotions**:

| 😊 Happy | 😢 Sad | 😡 Angry | 😨 Fear | 😮 Surprise | 😐 Neutral |
|---|---|---|---|---|---|

- **Myanmar (Burmese)** and **English** supported
- Per-message emotion badges
- Per-conversation mood analytics
- Explainable models — no black box

---

# Key Features

- 🎙️ **Voice messages** — recorded, transcribed, emotion-decoded
- 🏷️ **Live emotion badges** on every message
- 📊 **Analytics dashboards** — per chat and per person
- ⌨️ **Next-word autocomplete** (N-Gram)
- 🔒 **Private & offline** — local speech fallback, no cloud required
- 🇲🇲 **Myanmar-first** language support

---

# Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 · React 19 · Tailwind CSS v4 |
| Data & Auth | Supabase (Postgres, Auth, Realtime, Storage) |
| AI Backend | FastAPI (Python) |
| Models | N-Gram · HMM · Whisper / Faster-Whisper |
| Deployment | Vercel (frontend) · Render (backend) · Supabase Cloud |

---

# Architecture Flow

```
   Browser (React)
        │  HTTPS / REST
        ▼
┌─────────────────────────┐        ┌──────────────────────┐
│     Vercel (Frontend)   │        │   Supabase Cloud     │
│     Next.js 16 App      │◄──────►│  Postgres · Auth     │
│      Realtime UI        │        │  Realtime · Storage  │
└──────────┬──────────────┘        └──────────────────────┘
           │  /api/* (predict, voice, ngram)
           ▼
┌─────────────────────────┐
│     Render (Backend)    │
│     FastAPI (Python)    │
│  Emotion · N-Gram · HMM │
│  Speech-to-Text (Whisper)│
└─────────────────────────┘
```

- One **GitHub repo** drives Vercel + Render deployments
- Frontend talks to Supabase directly for auth/chat/realtime
- Frontend calls the backend only for **AI work**

---

# AI Pipeline

```
Message
   ▼
1. Language Detection   →  Myanmar / English
   ▼
2. Tokenize             →  per-script tokenizer
   ▼
3. N-Gram Scoring       →  6 emotion scores
   ▼
4. HMM Context Decode   →  conversation history refines result
   ▼
5. Emotion + Confidence →  badge + analytics
```

---

# AI Models (1) — N-Gram

- Character & word **n-grams** scored per emotion class
- Per-message emotion **probability vector**
- **Explainable** — every score traces to real tokens
- No neural net → fast on CPU, tiny footprint

> Used for: single-message emotion, next-word autocomplete

---

# AI Models (2) — Hidden Markov Model (HMM)

- Conversations are **sequences**, not singles
- HMM decodes the **entire emotion history** of a chat
- Mood **transitions** refine each prediction over time
- Context-aware: "grr" after happy ≠ same after angry

> Used for: context-refined emotion + live HMM state (shell)

---

# AI Models (3) — Speech-to-Text

| Path | Model | When |
|---|---|---|
| Primary | **OpenAI Whisper API** (cloud) | default |
| Fallback | **Faster-Whisper** (local CPU, int8) | no credits / offline |

- Voice file stored on **Supabase Storage**
- Transcribe → same N-Gram + HMM emotion stack
- Local fallback works with **zero cloud credits**

---

# Dataset (~13k labeled rows)

**English sources**
- dair-ai/emotion (Twitter emotion) — 16k+ train
- GoEmotions (Reddit, Ekman labels)
- ISEAR (psychology narratives)

**Myanmar sources**
- Burmese emotion dataset (linnaein)
- Myanmar sentiment corpus (Kalix — neutral)
- Nava-Rasa Myanmar corpus (classical rasas)

**Plus:** hand-curated neutral set; balanced **per language, per emotion**

---

# End-to-End: Voice Message

1. Record + upload to Supabase Storage
2. Backend transcribes (cloud → local fallback)
3. N-Gram predicts emotion from transcript
4. HMM refines with conversation history
5. Frontend shows badge + transcript **live** (Realtime)

---

# Deployment & Operations

- **Vercel** — Next.js frontend (env: Supabase URL/keys, Render API URL)
- **Render** — FastAPI backend (`/health` checks, Python 3.12)
- **Supabase Cloud** — Postgres migrations, Auth, Realtime, Storage
- CI/CD: push to GitHub → auto-deploy both apps
- CORS configured between frontend domain and backend

---

# Why It Matters

- ✅ **Explainable** AI — you can see *why* a mood was predicted
- ✅ **Private** — local speech fallback, no black boxes
- ✅ **Local-first** — runs on modest CPU hardware
- ✅ **Inclusive** — Myanmar and English, mixed text
- ✅ **Every message** — from words to feelings

---

# Thank You

### EmoChat — emotions for every message

_Free accounts · No black boxes · Clean, explainable emotion analysis on every conversation._

📬 Questions?