# 🏟️ CrowdControl
### *AI-Powered Smart Stadium Experience Platform*

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![GCP](https://img.shields.io/badge/Deployed%20on-Google%20Cloud-4285F4?logo=google-cloud&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-FFCA28?logo=firebase&logoColor=black)
![Gemini](https://img.shields.io/badge/Powered%20by-Gemini%203-8E75B2?logo=google&logoColor=white)
![Built with](https://img.shields.io/badge/Built%20with-Google%20Antigravity-FF6D00?logo=google&logoColor=white)

---
## 📖 What is CrowdControl?

CrowdControl is a real-time AI-powered stadium management and fan experience platform built for large-scale sporting venues. It combines live crowd intelligence, Gemini-powered navigation, predictive queue modelling, and personalised fan recommendations — all accessible from a single mobile-first web app.

**The Problem:** Attending a major sporting event often means navigating packed corridors, waiting in long queues, missing out on deals, and struggling to find your way around an unfamiliar venue.

**The Solution:** CrowdControl gives every fan a real-time AI co-pilot and gives venue staff a live operational command centre — turning chaos into a seamlessly guided experience.

---

## ✨ Features

### 🔴 CrowdLens — Spatial Intelligence
- Interactive SVG stadium heatmap with 12 live zones (Sections A–L)
- Real-time colour-coded density: Optimal (green) → Active (yellow) → High (orange) → Critical (red)
- WebSocket-powered updates every 3 seconds with zero page refresh
- Pulsing zone animations for rapidly filling sections
- Hover tooltips: zone name, current headcount, capacity, and density trend
- One-click spatial report generation for venue operations staff

### 🧭 PathFinder — AI Navigation
- Gemini 3-powered turn-by-turn routing across the entire venue
- Ingests live crowd density data to recommend the least congested path
- Destinations: Gates, Food Courts, Restrooms, Medical Bay, Merchandise, Exits
- Congestion warning badges when a route passes through high-density zones
- "Avoid Crowds" toggle that triggers an alternate AI-generated route
- Estimated walk time per route

### ⏱️ QueueSense — Predictive Queue Intelligence
- Tracks 8 service points: 3 food courts, 2 merchandise stores, 2 restroom clusters, 1 medical bay
- Wait time prediction powered by the **M/M/1 queuing theory model** (operations research)
- Real-time sparkline charts showing 10-minute wait history per service point
- "Best Choice" badge highlighting the shortest queue per category
- Filterable tabs: All | Food | Merch | Restrooms
- WebSocket live updates every 5 seconds

### ⚡ FanPulse — Personalised AI Recommendations
- 3-question onboarding: dietary needs, interests, time available
- Gemini 3 generates 5 hyper-personalised recommendations per fan
- Context-aware: accounts for live queue times, crowd density, active offers, and event stage
- Urgency labels: "Act Now", "Good Time", "Anytime"
- Swipeable recommendation cards with Framer Motion animations
- "Pulse It Again" for refreshed suggestions as the event evolves

### 🛡️ Admin Portal — Staff Command Centre
- Live zone density data table across all 12 sections
- Queue length overview for all 8 service points
- Automated alert feed: zones exceeding 85% capacity trigger deployment recommendations
- Manual zone override: staff can mark zones as "Closed" to reroute navigation AI

---

## 🌐 Live Demo

**[https://crowd-frontend-987426744408.us-central1.run.app](https://crowd-frontend-987426744408.us-central1.run.app)**

**[https://www.loom.com/share/9e90eba7bc3d43e999925f2919f6aa39](https://www.loom.com/share/9e90eba7bc3d43e999925f2919f6aa39)**

| Module | URL |
|---|---|
| 🏠 Home | `/` |
| 🔴 CrowdLens | `/map` |
| ⏱️ QueueSense | `/queue` |
| ⚡ FanPulse | `/recommendations` |
| 🛡️ Admin Portal | `/admin` |

---

## 🏗️ Architecture

```
CrowdControl
├── Frontend (Next.js 14 + TypeScript + Tailwind CSS)
│   ├── /app/page.tsx              → Fan Home + Venue Status Banner
│   ├── /app/map/page.tsx          → CrowdLens Heatmap
│   ├── /app/queue/page.tsx        → QueueSense Dashboard
│   ├── /app/recommendations/      → FanPulse AI Cards
│   ├── /app/admin/page.tsx        → Staff Portal
│   └── /components/NavigationPanel.tsx → PathFinder Panel
│
├── Backend (Python FastAPI)
│   ├── /api/routes/crowd.py       → Crowd density REST + WebSocket
│   ├── /api/routes/navigation.py  → AI navigation routes
│   ├── /api/routes/queue.py       → Queue prediction REST + WebSocket
│   ├── /api/routes/recommendations.py → FanPulse AI endpoint
│   ├── /services/gemini_service.py    → Gemini 3 integration
│   ├── /services/crowd_service.py     → Real-time zone simulation
│   ├── /services/queue_service.py     → M/M/1 queue model
│   └── /services/recommendation_service.py → AI context builder
│
└── Infrastructure (Google Cloud Platform)
    ├── Cloud Run         → Frontend + Backend containers
    ├── Artifact Registry → Docker image storage
    ├── Cloud Build       → CI/CD pipeline
    ├── Firestore         → Fan profiles + recommendation history
    ├── Firebase RTDB     → Real-time event streaming
    ├── Pub/Sub           → Crowd event messaging
    └── Secret Manager    → API key management
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| Backend | Python 3.11, FastAPI, WebSockets, Pydantic |
| AI / ML | Google Gemini 3 Pro (via google-generativeai SDK) |
| Realtime | WebSocket (FastAPI), Firebase Realtime Database |
| Database | Cloud Firestore |
| Deployment | Google Cloud Run |
| CI/CD | Google Cloud Build |
| Containers | Docker, Docker Compose |
| IDE / Agent | Google Antigravity (Gemini 3 agent-first IDE) |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Cloud SDK
- A Gemini API key from [aistudio.google.com](https://aistudio.google.com)
- A Firebase project

### 1. Clone the Repository
```bash
git clone https://github.com/kavinithi-sera/crowdcontrol.git
cd crowdcontrol
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
```
GEMINI_API_KEY=your_gemini_api_key
GCP_PROJECT_ID=your_gcp_project_id
FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_API_URL=http://localhost:8000
GOOGLE_APPLICATION_CREDENTIALS=service-account-key.json
```

### 3. Start the Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Open the App
Visit `http://localhost:3000` in your browser.

---

## 🐳 Run with Docker Compose

```bash
docker-compose up --build
```

This starts both the frontend (port 3000) and backend (port 8000) together.

---

## ☁️ GCP Deployment

### Enable Required Services
```bash
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  pubsub.googleapis.com \
  secretmanager.googleapis.com
```

### Build & Deploy
```bash
# Backend
gcloud builds submit --tag \
  asia-southeast1-docker.pkg.dev/$PROJECT_ID/crowdcontrol-repo/backend ./backend

gcloud run deploy crowdcontrol-backend \
  --image asia-southeast1-docker.pkg.dev/$PROJECT_ID/crowdcontrol-repo/backend \
  --platform managed --region asia-southeast1 --allow-unauthenticated

# Frontend
gcloud run deploy crowdcontrol-frontend \
  --image asia-southeast1-docker.pkg.dev/$PROJECT_ID/crowdcontrol-repo/frontend \
  --platform managed --region asia-southeast1 --allow-unauthenticated
```

CI/CD is configured via `cloudbuild.yaml` — every push to `main` automatically builds and deploys.

---

## 📁 Project Structure

```
crowdcontrol/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/routes/
│   │   ├── services/
│   │   ├── models/
│   │   └── core/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── Dockerfile
├── .github/workflows/deploy.yml
├── docker-compose.yml
├── cloudbuild.yaml
├── .env.example
└── README.md
```

---

## 🧠 How Gemini Powers CrowdControl

CrowdControl uses **Google Gemini 3 Pro** in three distinct ways:

1. **PathFinder Navigation** — Gemini receives a structured prompt containing the fan's current zone, destination, and a full snapshot of live crowd density across all 12 zones. It returns a JSON-structured step-by-step route that actively avoids congested areas.

2. **FanPulse Recommendations** — Gemini receives the fan's dietary preferences, interests, available time, current event stage (pre-game / halftime / post-game), live queue wait times, and active venue promotions. It generates 5 contextually relevant, urgency-labelled recommendations tailored specifically to that fan at that moment.

3. **Venue Assistant Chatbot** — A floating AI assistant on the home screen lets fans ask natural language questions. Gemini's system prompt is dynamically injected with live crowd and queue context so answers are always current and venue-aware.

---

## 🔬 The Science Behind QueueSense

QueueSense uses the **M/M/1 queuing model** from operations research to predict wait times:

```
Wait Time = Queue Length / (Service Rate - Arrival Rate)
```

This is the same mathematical model used in telecommunications, hospital management, and airport operations — applied here in real time to stadium service points, giving fans accurate, science-backed wait predictions rather than guesswork.


---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

Built using **Google Antigravity** — the agent-first IDE powered by Gemini 3.

> *"Your venue, intelligently guided."*
