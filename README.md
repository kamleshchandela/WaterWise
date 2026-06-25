
<p align="center">
  <img src="https://img.shields.io/badge/WaterWise-v1.0-0077B6?style=for-the-badge&logo=water&logoColor=white" alt="WaterWise">
  <img src="https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F%20for%20India-FF6B35?style=for-the-badge" alt="Made with Love for India">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/Groq_AI-FF6600?style=flat&logo=groq&logoColor=white" alt="Groq AI">
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white" alt="Cloudinary">
</p>

<h1 align="center">🌊 WaterWise</h1>
<p align="center"><b>Know the hidden water cost of your food. Eat smarter. Save water.</b></p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=flat" alt="Status">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat" alt="License">
  <img src="https://img.shields.io/badge/platform-mobile_web-brightgreen?style=flat" alt="Platform">
</p>

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [The Vision](#-the-vision)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Endpoints](#-api-endpoints)
- [Why WaterWise?](#-why-waterwise)
- [Future Roadmap](#-future-roadmap)

---

## ❓ Problem Statement

<p align="center">
  <b>India is facing its worst water crisis in history.</b>
</p>

> **600 million** people face high to extreme water stress.  
> **84%** of India's freshwater is used for agriculture.  
> Yet, **the average person has no idea** how much water goes into their plate.

| Food Item | Water Footprint |
|-----------|:--------------:|
| 🥩 Beef (1kg) | **15,400 L** |
| 🍚 Rice (1kg) | **2,500 L** |
| 🐔 Chicken (1kg) | **4,300 L** |
| 🧀 Cheese (1kg) | **5,000 L** |
| 🥬 Vegetables (1kg) | **~300 L** |
| 🥚 1 Egg | **200 L** |

**The gap:** People don't know which foods are water-intensive, and they don't know what better alternatives exist that are **locally available** and **culturally appropriate** for their diet.

---

## 💡 The Vision

WaterWise makes the **invisible visible** — empowering every Indian to make water-conscious food choices without sacrificing nutrition or culture.

### What Makes WaterWise Different?

| Problem | WaterWise Solution |
|---------|-------------------|
| 😕 "I don't know my food's water cost" | 📸 **Snap a photo** → AI identifies the food → instant water footprint |
| 🤷 "What should I eat instead?" | 🥗 **4-5 smarter alternatives** with water savings |
| 🗺️ "Where do I find them?" | 🔗 **Google Maps links** customized to your district |
| 🥦 "But I'm vegetarian/Jain..." | 🧘 **Respects your dietary category** |
| 🌏 "Is it available locally?" | 📍 **Indian state & district based suggestions** |

---

## ⚙️ How It Works

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│ 📸 Take  │ →  │ 🧠 AI Identifies│ →  │ 💧 Calculate │ →  │ 🥗 Suggest Better │
│  Photo   │    │   Your Food   │    │ Water Usage  │    │  Alternatives    │
└──────────┘    └──────────────┘    └──────────────┘    └──────────────────┘
                                                              │
                                                              ▼
                                                     ┌──────────────────┐
                                                     │ 🗺️ Find Near Me │
                                                     │  (Google Maps)   │
                                                     └──────────────────┘
```

1. **📸 Upload or click a photo** of your meal (camera / gallery / re-analyze)
2. **🧠 AI identifies the food** using Groq's LLaMA-4 Scout 17B vision model
3. **💧 Water footprint is calculated** based on scientific benchmarks
4. **🥗 4-5 alternatives suggested** — lower water, same nutrition, locally available
5. **🗺️ Google Maps link** to find alternatives near your district

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| ⚛️ **React 18** | UI framework |
| ⚡ **Vite 5** | Build tool (blazing fast) |
| 🧭 **React Router 6** | Client-side routing |
| 🎨 **Tailwind CSS 3** | Utility-first styling |
| 🔗 **Axios** | HTTP client |
| 🔔 **react-hot-toast** | Beautiful notifications |

### Backend

| Technology | Purpose |
|------------|---------|
| 🟢 **Node.js + Express 4** | REST API server |
| 🍃 **MongoDB + Mongoose 8** | Database + ODM |
| 🔐 **bcryptjs + JWT** | Authentication |
| ☁️ **Cloudinary** | Image cloud storage |
| 📤 **Multer** | File upload handling |
| 🤖 **Groq SDK (LLaMA-4 Scout 17B)** | AI vision inference |
| 📍 **Google Maps** | Location-based food finding |

### Architecture
```
client/ (React + Vite)
    ↕ HTTP / REST
server/ (Express + MongoDB)
    ↕ Drivers
MongoDB Atlas  |  Cloudinary  |  Groq AI
```

---

## ✨ Features

### 📱 Core Features
- ✅ **AI Food Recognition** — Identify food from camera or gallery photos
- ✅ **Water Footprint Calculation** — Instant liters-per-serving data
- ✅ **Smart Alternatives** — 4-5 lower-water, diet-appropriate suggestions
- ✅ **Google Maps Integration** — "Find Near Me" for each alternative
- ✅ **Dietary Preferences** — Vegetarian / Jain / Eggetarian / Non-Vegetarian

### 👤 User Features
- ✅ **Multi-step Signup** — Name, email, location, diet
- ✅ **Login/Logout** — JWT-based secure authentication
- ✅ **Profile Dashboard** — Stats: total analyses, avg water/meal, water saved
- ✅ **Login History** — Track login activity with IP
- ✅ **Analysis History** — Browse all past meals in a grid

### 🖥️ UI/UX
- ✅ **Mobile-first Design** — Optimized for phones (max 430px)
- ✅ **Bottom Navigation** — Home | Upload | Profile
- ✅ **Input Modes** — Camera, Gallery, Re-analyze
- ✅ **Loading States** — Spinners with contextual messages
- ✅ **Toast Notifications** — Success/error feedback

---

## 📁 Project Structure

```
waterwise/
├── 📂 client/                  # React Frontend
│   ├── 📄 index.html
│   ├── 📦 package.json
│   ├── ⚡ vite.config.js
│   ├── 🎨 tailwind.config.js
│   └── 📂 src/
│       ├── 📄 App.jsx          # Router + Auth Guard
│       ├── 📄 main.jsx         # Entry point
│       ├── 📂 context/         # Auth state management
│       ├── 📂 pages/           # Home, Login, Signup, Upload, Profile, Detail
│       ├── 📂 components/      # Navbar, Badge, Cards, Loader
│       └── 📂 utils/           # Axios API client
│
├── 📂 server/                  # Express Backend
│   ├── 📦 package.json
│   ├── 📄 server.js            # Main app entry
│   ├── 📂 middleware/          # JWT auth middleware
│   ├── 📂 models/              # User & Analysis schemas
│   ├── 📂 routes/              # auth, user, analysis APIs
│   └── 📂 utils/               # Cloudinary, Groq, Maps helper
│
├── 📄 README.md                # 👈 You are here
└── 📄 .gitignore
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js **v18+**
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Groq API key

### 1️⃣ Clone & Install
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2️⃣ Configure Environment
```bash
cd server

# Edit .env with your credentials:
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GROQ_API_KEY=your_groq_api_key
```

### 3️⃣ Run
```bash
# Terminal 1: Start backend (port 5000)
cd server
npm run dev

# Terminal 2: Start frontend (port 3000)
cd client
npm run dev
```

### 4️⃣ Build for Production
```bash
cd client
npm run build    # outputs to client/dist/
```

---

## 🌐 API Endpoints

### 🔐 Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register new user |
| `POST` | `/api/auth/login` | Login → returns JWT token |

### 📸 Analysis (`/api/analysis`)
| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/api/analysis/upload` | ✅ | Upload + analyze food image |
| `POST` | `/api/analysis/reanalyze` | ✅ | Re-run AI on past image |
| `GET` | `/api/analysis/history` | ✅ | Get all user analyses |
| `GET` | `/api/analysis/:id` | ✅ | Get single analysis detail |

### 👤 User (`/api/user`)
| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/api/user/profile` | ✅ | Profile + aggregated stats |

---

## 🌟 Why WaterWise?

<p align="center">
  <b>💧 Every liter counts. Every meal matters.</b>
</p>

| 💪 Powerful | 🎯 Targeted | 🧘 Respectful |
|:-----------:|:-----------:|:-------------:|
| AI-powered food recognition | Indian state/district data | Dietary preference aware |
| Scientific water benchmarks | Google Maps integration | Culturally appropriate |
| Real-time analysis | Locally available suggestions | No forced changes |

### The Impact
```
If 1,000 users replace 1 beef meal/week with a plant alternative:
→ ~15,000,000 L of water saved per week
→ ~780,000,000 L per year
→ That's enough for ~15,000 Indian families for a year
```

---

## 🗺️ Future Roadmap

- [ ] 📊 **Compare Mode** — Side-by-side water usage across meals
- [ ] 📥 **Data Export** — Download your analysis history as PDF/CSV
- [ ] 🏆 **Leaderboards** — Gamified water savings with friends
- [ ] 🌙 **Dark Mode** — Easy on the eyes
- [ ] 🔎 **Search & Filter** — Find past analyses quickly
- [ ] 🔐 **Password Reset** — Forgot password flow
- [ ] ✅ **Email Verification** — Confirm signups
- [ ] 📈 **Weekly Reports** — Personalized water-saving insights
- [ ] 📱 **PWA Support** — Install as native app
- [ ] 🧪 **Unit + E2E Tests** — Rock-solid reliability
- [ ] 🌐 **Multi-language** — Hindi, Gujarati, Marathi + more
- [ ] 📶 **Offline Mode** — Analyze without internet

---

<p align="center">
  <img src="https://img.shields.io/badge/Built%20with-%E2%9D%A4%EF%B8%8F%20for%20a%20water%20secure%20India-0077B6?style=for-the-badge" alt="For India">
</p>

<p align="center">
  <b>WaterWise</b> — Because the most sustainable meal is the one you don't think twice about.
</p>

<p align="center">
  <sub>Made with 💙 by the WaterWise Team</sub>
</p>
