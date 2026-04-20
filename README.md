# 🏟️ CrowdFlow AI — Intelligent Stadium Crowd Management

> AI-powered real-time crowd intelligence platform for smart stadium management. Built with Next.js, Node.js, Socket.io, and Google Gemini.

![CrowdFlow AI](https://img.shields.io/badge/CrowdFlow-AI-00deec?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik0xMiAyYTEwIDEwIDAgMCAwIDAgMjAgMTAgMTAgMCAwIDAgMC0yMHoiLz48L3N2Zz4=)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-010101?style=flat-square&logo=socket.io)

## 🎯 Problem Statement

Managing crowd flow in large stadiums during live events is a massive challenge:
- **Safety hazards** from uncontrolled crowd surges and bottlenecks
- **Poor fan experience** with long wait times at food stalls, exits, and restrooms
- **Inefficient resource allocation** of security and staff

## 💡 Solution

**CrowdFlow AI** is a real-time intelligent stadium management platform that uses:

| Engine | Description |
|--------|-------------|
| 🔥 **Crowd Density Engine** | Real-time heatmap visualization across all stadium zones |
| 🔮 **Predictive Engine** | AI forecasting congestion 10+ minutes ahead |
| 🗺️ **Smart Router** | Crowd-aware A* pathfinding for optimal navigation |
| 🍔 **Queue Optimizer** | Live vendor ranking by wait time with virtual queuing |
| 🤖 **AI Assistant** | Gemini-powered natural language stadium helper |
| 🚨 **Emergency Mode** | One-click evacuation routing for all zones |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              CrowdFlow AI Frontend              │
│  Next.js 16 • Tailwind CSS v4 • TypeScript      │
│  Real-time WebSocket • Responsive Mobile UI      │
├─────────────────────────────────────────────────┤
│              WebSocket (Socket.io)               │
├─────────────────────────────────────────────────┤
│              CrowdFlow AI Backend               │
│  Express.js • TypeScript • Gemini AI             │
│  5 Intelligence Engines • Graph Pathfinding      │
└─────────────────────────────────────────────────┘
```

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
npm run dev
# → http://localhost:3001
```

### Frontend
```bash
cd crowdflow-frontend
npm install
npm run dev
# → http://localhost:3000
```

## 📱 Screens

| Screen | Route | Description |
|--------|-------|-------------|
| 🏟️ Stadium | `/` | Live heatmap, fastest food, exit time, AI insights |
| 🧠 Intelligence | `/dashboard` | Analytics, predictive timeline, resource allocation |
| 🚶 Flow | `/queues` | Queue rankings, gates, washrooms, AI alerts |
| 🗺️ Navigation | `/map` | Full-screen routing with turn-by-turn directions |
| 🔔 Alerts | `/alerts` | Critical, predictive, and opportunity notifications |

## 🎨 Design System

- **Colors**: Neon Cyan `#8ff5ff` • Purple `#ebb2ff` • Green `#8eff71`
- **Fonts**: Space Grotesk (headlines) • Inter (body) • Material Symbols
- **Style**: Glassmorphism, neon glows, dark mode, bento grid layouts

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | System status |
| `/api/crowd/density` | GET | Current density data |
| `/api/crowd/predictions` | GET | AI predictions |
| `/api/route/find` | POST | Smart pathfinding |
| `/api/route/emergency` | POST | Emergency evacuation |
| `/api/queue/rankings` | GET | Vendor queue rankings |
| `/api/assistant/chat` | POST | AI assistant |
| `/api/simulation/trigger` | POST | Event triggers |

## 🔧 Tech Stack

**Frontend**: Next.js 16, React 19, Tailwind CSS v4, TypeScript, Socket.io Client  
**Backend**: Express.js, Socket.io, Google Gemini AI, TypeScript  
**Design**: Stitch (Google) for UI mockups  

## 📄 License

MIT License — Built for Virtual Hackathon 2026
