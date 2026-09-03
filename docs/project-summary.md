# EmoChat — Project Summary

## What It Is
EmoChat is a real-time 1-to-1 messaging app that decodes the **emotion** behind every message. Each text and voice message is classified into one of six emotions — happy, sad, angry, fear, surprise, neutral — in real time, for both **Myanmar (Burmese)** and **English**.

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Auth & Data | Supabase (Postgres, Auth, Realtime, Storage) |
| AI Backend | FastAPI (Python 3.12) |
| Speech | OpenAI Whisper API + Faster-Whisper (local CPU fallback) |
| Deployment | Vercel (frontend), Render (backend), Supabase Cloud |

## AI Models
- **Language Detector** — routes messages by script (Myanmar/English) before analysis.
- **N-Gram Model** — character + word n-grams score each message against 6 emotion classes; explainable, no neural net, fast on CPU.
- **Hidden Markov Model (HMM)** — decodes the full conversation history so mood transitions refine every prediction in context.
- **Whisper Speech-to-Text** — cloud API primary; Faster-Whisper (CPU, int8) fallback for offline transcription.
- **N-Gram Autocomplete** — suggests next words while typing.

## Dataset
~13,000 labeled rows balanced per language per emotion.

**English:** dair-ai/emotion (Twitter), GoEmotions (Reddit), ISEAR (psychology)
**Myanmar:** Burmese emotion dataset, Myanmar sentiment corpus, Nava-Rasa classical corpus
**Plus:** hand-curated neutral examples.

## Key Features
- Real-time 1-to-1 chat with live emotion badges
- Voice messages with live transcription + emotion analysis
- Per-conversation and per-person emotion analytics dashboards
- Next-word N-Gram autocomplete
- Local speech fallback (works with no cloud credits)
- Myanmar-first language support
- Explainable AI — every prediction is traceable

## Deployment
- **Vercel** — Next.js frontend, env vars point to Supabase + Render backend.
- **Render** — FastAPI backend, Python 3.12, health check at `/health`.
- **Supabase Cloud** — Postgres migrations, auth, realtime subscriptions, voice file storage.
- Single GitHub repo (`star-cat414/EmoChat`) drives both deployments.

## Key Metrics
- Held-out accuracy: overall **0.67**, Myanmar **0.83**, English **0.61**
- Model training from cached dataset on cold start (< 2s)
- Voice transcription: cloud ~1–2s; local ~5–15s (first call downloads ~145MB Whisper model)
