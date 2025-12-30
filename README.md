# 💧 SmartSip

**AI-Powered Hydration Tracking PWA**

SmartSip helps you stay hydrated with intelligent tracking, personalized goals, and an AI coach. Built as a Progressive Web App for seamless mobile and desktop experience.

![SmartSip](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

---

## ✨ Features

- **🎯 Smart Goal Tracking** - Dynamic daily goals based on activity, weather, and health conditions
- **🤖 AI Hydration Coach** - Personalized feedback powered by Groq LLM
- **🔥 Streak System** - Gamified motivation with badges and celebrations
- **🍵 Multi-Drink Support** - Track water, coffee, tea, and more with hydration multipliers
- **📊 Visual Analytics** - Beautiful charts and progress visualizations
- **🌙 Dark Mode** - Easy on the eyes, day or night
- **📱 PWA Install** - Add to home screen for native-like experience
- **☁️ Cloud Sync** - Sign in with Google to sync across devices

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React, Vite, Tailwind CSS |
| **Backend** | FastAPI, Python, SQLAlchemy |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (Google OAuth) |
| **AI** | Groq API (Llama 3.1) |
| **Hosting** | Vercel (Frontend), Render (Backend) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- Supabase account (free tier)
- Groq API key (free tier)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/smartsip.git
   cd smartsip
   ```

2. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your Supabase credentials
   npm run dev
   ```

3. **Setup Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your database URL and API keys
   uvicorn backend:app --reload --port 8001
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

---

## 📁 Project Structure

```
SmartSip/
├── frontend/               # React/Vite frontend
│   ├── src/
│   │   ├── App.jsx        # Main application
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities (Supabase client)
│   │   └── constants/     # Drink types, badges, etc.
│   ├── .env.example       # Environment template
│   └── vercel.json        # Vercel deployment config
├── backend/               # FastAPI backend
│   ├── backend.py         # API routes and logic
│   ├── database.py        # SQLAlchemy setup
│   ├── models.py          # Database models
│   ├── requirements.txt   # Python dependencies
│   └── .env.example       # Environment template
├── render.yaml            # Render deployment config
├── DEPLOYMENT.md          # Deployment guide
├── SUPABASE_SETUP.md      # Supabase configuration
├── GOOGLE_OAUTH_SETUP.md  # OAuth setup guide
└── QA_CHECKLIST.md        # Testing checklist
```

---

## 🔐 Environment Variables

### Frontend (`frontend/.env`)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8001/api
```

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://user:pass@host:5432/db
GROQ_API_KEY=your-groq-api-key
CORS_ORIGINS=http://localhost:5173
```

---

## 📖 Documentation

- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [QA Checklist](./QA_CHECKLIST.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend as a Service
- [Groq](https://groq.com) - Fast AI inference
- [Lucide](https://lucide.dev) - Beautiful icons
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS

---

**Made with 💙 and lots of water**
