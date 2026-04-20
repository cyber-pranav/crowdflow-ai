# 🏟️ CrowdFlow AI — Intelligent Stadium Crowd Management

> AI-powered real-time crowd intelligence platform for smart stadium management. Built with Next.js, Node.js, Socket.io, and Google Gemini.

![CrowdFlow AI](https://img.shields.io/badge/CrowdFlow-AI-00deec?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik0xMiAyYTEwIDEwIDAgMCAwIDAgMjAgMTAgMTAgMCAwIDAgMC0yMHoiLz48L3N2Zz4=)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-010101?style=flat-square&logo=socket.io)
![Tests](https://img.shields.io/badge/Tests-52%20passing-22c55e?style=flat-square)

---

## 🎯 Problem Statement

Managing crowd flow in large stadiums during live events creates three critical challenges:

1. **Safety hazards** — Uncontrolled crowd surges at exits, bottlenecks in concourses, and delayed emergency response
2. **Long wait times** — Fans spend 20+ minutes in food queues while nearby stalls sit empty
3. **Reactive management** — Staff responds to congestion *after* it happens, not before

**CrowdFlow AI solves this with predictive intelligence that detects, forecasts, and redirects crowd flow in real time.**

## 💡 How It Solves the Problem

Every feature directly maps to a real-world crowd management outcome:

| Feature | Problem Solved | How |
|---------|---------------|-----|
| **Real-time Heatmap** | Staff can't see crowd distribution | Aggregates 500+ user positions into zone-level density with trend tracking (rising/falling/stable) |
| **Predictive Engine** | Congestion detected too late | 3 algorithms (velocity vectors, event phase patterns, occupancy trends) forecast congestion **10+ minutes ahead** |
| **A* Smart Routing** | Fans walk through crowded zones | Crowd-aware pathfinding with 3 weight modes (fastest, least crowded, balanced) that continuously reroutes |
| **Queue Optimizer** | Fans join the nearest, not shortest queue | Composite scoring (wait time × 0.5 + walk time × 0.3 + density × 0.2) ranks all vendors dynamically |
| **AI Assistant** | Fans have no centralised information | Gemini-powered NLP with injected live stadium data answers "Where should I eat?" with real-time accuracy |
| **Emergency Evacuation** | Slow evacuation response | One-click A* routing to nearest exit for all zones using dedicated emergency paths |

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  CrowdFlow AI Frontend                       │
│  Next.js 16 • Tailwind CSS v4 • TypeScript                   │
│  Real-time WebSocket • Responsive • WCAG Accessible          │
├──────────────────────────────────────────────────────────────┤
│                   WebSocket (Socket.io)                       │
│         density:update • prediction:alert • queue:update      │
├──────────────────────────────────────────────────────────────┤
│                  CrowdFlow AI Backend                         │
│  Express.js • TypeScript • Helmet • Rate Limiting             │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ CrowdDensity│  │ Predictive  │  │   Smart     │          │
│  │   Engine    │  │   Engine    │  │   Router    │          │
│  │ (Heatmap)   │  │ (Forecast)  │  │  (A* Path)  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Queue     │  │ AI Assistant│  │  Firestore  │          │
│  │ Optimizer   │  │  (Gemini)   │  │   Sync      │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
├──────────────────────────────────────────────────────────────┤
│              Google Cloud Services                            │
│  Gemini AI • Firebase Firestore • Firebase Admin              │
└──────────────────────────────────────────────────────────────┘
```

## 🧠 Where AI is Used

### Google Gemini AI (Deep Integration)
- **Context-Aware Chat**: Every Gemini API call includes injected live data — current zone densities, active prediction alerts, vendor queue lengths, and the user's location. This enables responses like *"North Food Court has a 3-minute wait and is only 50m from you"* rather than generic advice.
- **Conversation Memory**: Maintains a 6-message sliding window for multi-turn dialogue.
- **Intelligent Fallback**: When Gemini is unavailable, a rule-based engine covers food, exit, crowd, route, and timing queries using the same live data.

### Predictive Intelligence (Custom ML-like Algorithms)
1. **Velocity Vector Analysis** — Tracks user movement direction over 2-minute windows. If 30+ users are heading toward Zone A, predicts congestion 2-8 minutes ahead.
2. **Event Phase Patterns** — Knows halftime → food court surge (88% confidence), post-event → exit surge (95% confidence).
3. **Occupancy Trend Extrapolation** — Calculates rate-of-change per zone per minute. If rising at 20+ users/min, forecasts when HIGH threshold will be hit.

## 🔌 Where Google Services are Used

| Service | Integration Depth | Usage |
|---------|------------------|-------|
| **Gemini API** | Core feature | Powers AI assistant with live context injection, conversation history, and intelligent fallback |
| **Firebase Firestore** | Data persistence | Batch-writes crowd snapshots, prediction alerts, and queue data every 5 ticks for analytics and state recovery |
| **Firebase Admin** | Authentication-ready | Initialised for user auth/personalization (service account integration) |
| **Google Stitch** | Design tooling | Used for UI/UX mockup generation and design system creation |

## 🔒 Security

- **Helmet.js** — HTTP security headers
- **Input Validation** — All route params validated against stadium graph (zone IDs), enums (vendor types), and safe ranges (userCount: 1-5000, tickInterval: 500-10000ms)
- **Rate Limiting** — Read endpoints: 200 req/min, Write endpoints: 30 req/min
- **CORS** — Restricted to deployed frontend origin in production
- **Message Sanitization** — Chat messages trimmed and length-capped (500 chars)

## ♿ Accessibility

- **Skip-to-content** link for keyboard navigation
- **ARIA labels** on all interactive elements (buttons, navigation, inputs)
- **`aria-current="page"`** on active navigation tabs
- **`aria-live` regions** for real-time update announcements
- **`prefers-reduced-motion`** — Disables all animations for vestibular disorders
- **`prefers-contrast: more`** — High-contrast color overrides
- **Focus-visible outlines** — 2px primary-colored rings on keyboard focus
- **Minimum 44-48px touch targets** on all interactive elements
- **Semantic HTML** — `<header>`, `<main>`, `<nav>` with proper `role` attributes

## 🧪 Testing

**52 tests across 6 test suites — all passing**

```
✓ CrowdDensityEngine — Heatmap Brain (5 tests)
✓ PredictiveEngine — Congestion Forecasting (5 tests)
✓ SmartRouter — A* Pathfinding (6 tests)
✓ QueueOptimizer — Dynamic Vendor Ranking (10 tests)
✓ SimulationService — Crowd Behavior Scenarios (9 tests)
✓ Input Validators — Security Layer (17 tests)
```

Run tests: `cd crowdflow-backend && npm test`

## ⚡ Efficiency

- **Binary Heap Priority Queue** — A* pathfinding uses O(log n) enqueue/dequeue instead of O(n log n) array sort
- **Batched Firestore Writes** — Buffers 5 snapshots before flushing to reduce write operations
- **Split Rate Limiting** — Separate limits for read (200/min) and write (30/min) endpoints
- **Edge Weight Caching** — Stadium graph pre-computes density-adjusted edge weights on occupancy change

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 9+

### Backend
```bash
cd crowdflow-backend
cp .env.example .env
# Add your GEMINI_API_KEY to .env
npm install
npm test        # Run 52 tests
npm run dev     # → http://localhost:3001
```

### Frontend
```bash
cd crowdflow-frontend
npm install
npm run dev     # → http://localhost:3000
```

## 📱 Screens

| Screen | Route | Description |
|--------|-------|-------------|
| 🏟️ Stadium | `/` | Live heatmap, fastest food, exit time, AI chat |
| 🧠 Intelligence | `/dashboard` | Analytics, predictive timeline, simulation controls |
| 🚶 Flow | `/queues` | Queue rankings, gates, washrooms, AI alerts |
| 🗺️ Navigation | `/map` | Full-screen routing with real-time path rendering |
| 🔔 Alerts | `/alerts` | Critical, predictive, and opportunity notifications |

## 🎨 Design System

- **Colors**: Neon Cyan `#8ff5ff` • Purple `#ebb2ff` • Green `#8eff71`
- **Fonts**: Space Grotesk (headlines) • Inter (body) • Material Symbols
- **Style**: Glassmorphism, neon glows, dark mode, bento grid layouts

## 🔧 Tech Stack

**Frontend**: Next.js 16, React 19, Tailwind CSS v4, TypeScript, Socket.io Client  
**Backend**: Express.js, Socket.io, Google Gemini AI, Firebase Admin, TypeScript  
**Infrastructure**: Vercel (frontend), Render (backend)  
**Design**: Google Stitch for UI/UX mockups  

## 📄 License

MIT License — Built for Virtual Hackathon 2026
