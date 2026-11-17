# Gates of Hell

**B2B sales objection simulator and high-stakes voice training engine.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Dexie.js](https://img.shields.io/badge/Dexie.js-Offline_IndexedDB-blue?style=flat-square)](https://dexie.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud_Sync-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

---

## Overview

### The Problem It Solves
Sales representatives frequently fumble high-value deals when faced with aggressive prospect resistance—price objections, timing delays, competitor lock-ins, and trust skepticism. Traditional sales training relies on static roleplay scripts without pressure simulation, objective recording capture, or quantifiable metrics on objection handling performance.

### Why It Was Built
Built on the battle-tested "Gates of Hell" objection framework, this platform provides an interactive pressure-cooker environment. Sales reps train against sequential objection gates under live timers, record their real voice responses directly into indexed browser storage, score their performance, and sync training retrospectives to team leaderboards.

---

## Key Features

- **Sequential Objection Gates:** Structured training through the critical hurdles of B2B sales:
  - Gate 1: Initial Brush-Off & Gatekeeper Defense
  - Gate 2: The Price & Budget Barrier
  - Gate 3: Competitor Preference & Incumbent Lock-in
  - Gate 4: Decision Timing & Urgency Deflection
  - Gate 5: Final Authority & Closing Resistance
- **Live In-Browser Voice Recording:** Direct microphone capture storing audio blobs locally in IndexedDB (`db.recordings`) for post-session playback and coaching review.
- **Offline-First Local Architecture:** Powered by Dexie.js, all prospects, sessions, recordings, notes, and trial outcomes are stored locally and instantly available without internet dependency.
- **Cloud Leaderboard & Sync:** Seamless sync via Supabase (`@supabase/supabase-js`) to compare objection survival rates and team training milestones.
- **Interactive Session Analytics:** Quantifies pass/fail rates per gate, tracks objection trial trends, and surfaces recurring pitch weaknesses.
- **Fluid Dark-Mode UI:** Dynamic HUD built with Framer Motion, Lucide icons, and responsive telemetry indicators.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 React 19 + Vite Frontend                    │
│   Gate HUD · Live Mic Recorder · Objection Timer · Analysis │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
         Local Audio Blob              Cloud Leaderboard
          & Session State                  Sync Engine
               │                              │
┌──────────────▼──────────────┐       ┌───────▼──────────────┐
│       Dexie.js Engine       │       │    Supabase Client   │
│  (Client IndexedDB Storage) │       │   (Cloud Telemetry)  │
│  Prospects · Sessions       │       │   User Leaderboards  │
│  Audio Recordings · Notes   │       │   Team Benchmarks    │
└─────────────────────────────┘       └──────────────────────┘
```

---

## Tech Stack

- **Framework:** React 19 (Hooks, Context), Vite
- **Offline Storage:** Dexie.js (IndexedDB abstraction layer)
- **Cloud Sync:** Supabase JS Client (`@supabase/supabase-js`)
- **Animation & Motion:** Framer Motion
- **Icons & Visuals:** Lucide React
- **Styling:** Tailwind CSS, Custom Utilities

---

## Repository Structure

```
├── src/
│   ├── assets/               # Brand artwork and hero assets
│   ├── App.jsx               # Master training HUD and gate simulator loop
│   ├── db.js                 # Dexie.js database schema and CRUD store helpers
│   ├── hooks.js              # Custom React hooks for session timers and state
│   ├── supabase.js           # Supabase client initialization
│   ├── main.jsx              # React 19 root entry point
│   └── App.css / index.css   # Tailored dark-mode HUD stylings
├── public/                   # Favicon and static SVGs
├── index.html                # HTML5 application shell
└── vite.config.js            # Vite build configuration
```

---

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- Modern browser with microphone access permission (Chrome, Edge, Firefox, Brave)
- Supabase project credentials (optional for cloud sync)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/KarthikeyaGSI/Gates-of-hell.git
cd Gates-of-hell
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (optional):
```bash
cp .env.example .env
```

### Environment Variables

Configure `.env`:
```env
# Supabase Cloud Configuration (Optional)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
> *Note: If Supabase credentials are not provided, the platform automatically defaults to 100% offline-first operation via Dexie.js.*

4. Launch the training app:
```bash
npm run dev
```

Navigate to `http://localhost:5173` and allow microphone permissions to begin trial simulations.

---

## Author & Maintainer

**Karthikeya Thallapally**  
Founder, [MarketingKo](https://marketingko.in/)  
Twitter / X: [@thekarthgsi](https://twitter.com/thekarthgsi) · GitHub: [@KarthikeyaGSI](https://github.com/KarthikeyaGSI)
