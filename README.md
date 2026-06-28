# NextPath AI - Professional AI Career Coach

NextPath AI is a feature-rich, high-performance, and visually stunning web application designed to act as a personal career advisor. Powered by the **Google Gemini API** and built with modern Web technologies, it handles everything from resume compatibility scoring to mock interviews and coding exercises, helping candidates fast-track their hiring pipeline.

Developed by **Mohammad Tausif**.
## 🎥 Demo Video

[📹 Demo Video (MKV)](./2026-06-28%2020-33-16.mkv)
---

## 🌟 Key Features

- **📊 Dashboard Cockpit**: Unified career overview displaying resume compatibility scores, active roadmaps, learning module progress, and mock interview results.
- **🗺️ Career Roadmap Generator**: Generates customized step-by-step milestones with recommended action items and study resources based on target duration and experience.
- **📄 Resume Analyzer**: Upload a PDF or paste plain text to check keyword matching, structural alignment, strengths, weaknesses, and Google X-Y-Z formula bullet point rewrites.
- **✉️ Cover Letter Generator**: Creates tailored job application letters with adjustable tones (Professional, Enthusiastic, Creative, Executive).
- **💼 LinkedIn Profile Optimizer**: Drafts high-conversion recruiter-facing headlines and a keyword-rich "About" section bio.
- **🎯 Skill Gap Analyzer**: Compares candidate resumes with target job descriptions, lists critical vs. optional missing skills, and suggests resources.
- **📅 Daily Learning Plan**: Designs structured 7-day study curriculum grids featuring daily checklists and multiple-choice self-check quizzes.
- **🎙️ Mock Interview Simulator**: Interactive conversational prep tool featuring real-time client-side text-to-speech audio question generation, score feedback, and recommended responses.
- **💻 Coding Sandbox**: Split-screen compiler environment where candidates can pick algorithmic challenges (Easy, Medium, Hard) and get complexity/logic feedback.
- **💰 Salary Insights**: CSS progress chart bar grids highlighting regional base compensation levels (entry, mid, senior percentiles) and negotiation advice.
- **💬 AI Coach Chat Assistant**: Persistent conversational interface to ask career, cover letter, or mock preparation advice.

---

## 🛠️ Technology Stack

- **Frontend**: React (v18), Vite, Vanilla CSS (with radial neon glow transitions & glassmorphism components)
- **Backend**: Node.js, Express
- **Database**: SQLite (local persistence file `coach.db`)
- **AI Engine**: Google Gemini API (`gemini-2.5-flash` model integration via `@google/generative-ai`)
- **Containerization**: Docker & Docker Compose (multi-stage Nginx static builder)

---

## 📂 Project Structure

```
ai-career-coach/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── .env
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── database.js
│       ├── server.js
│       ├── middleware/
│       │   └── auth.js
│       └── services/
│           └── geminiService.js
└── frontend/
    ├── Dockerfile
    ├── index.html
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        └── components/
            ├── Auth.jsx
            ├── Dashboard.jsx
            ├── RoadmapGenerator.jsx
            ├── ResumeAnalyzer.jsx
            ├── CoverLetterGenerator.jsx
            ├── LinkedInOptimizer.jsx
            ├── SkillGapAnalyzer.jsx
            ├── LearningPlan.jsx
            ├── MockInterview.jsx
            ├── CodingEnvironment.jsx
            ├── SalaryInsights.jsx
            └── ChatAssistant.jsx
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Docker](https://www.docker.com/) (If running via containerized environment)
- A **Google Gemini API Key** (You can acquire one from [Google AI Studio](https://aistudio.google.com/))

### Configuration (`.env`)

Create a `.env` file inside the `backend` directory:
```env
PORT=5000
JWT_SECRET=your_custom_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
```

*Note: If `GEMINI_API_KEY` is left blank, the application will automatically activate a comprehensive mock fallback mode displaying realistic mock dashboards, timelines, and chat dialogues for exploration.*

---

## 🐳 Option 1: Running with Docker (Recommended)

To build and launch the backend SQLite service alongside the frontend Nginx static server in a single step:

1. Open a terminal in the root `ai-career-coach` directory.
2. Build and run the services:
   ```bash
   docker-compose up --build
   ```
3. Open your browser and navigate to: **`http://localhost:8080`**

---

## 💻 Option 2: Running Locally for Development

To launch the backend API and frontend Vite server independently:

### Step 1: Run the Backend API
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install server-side dependencies:
   ```bash
   npm install
   ```
3. Start the node server:
   ```bash
   npm start
   ```
The backend server will run at `http://localhost:5000`.

### Step 2: Run the React Frontend
1. Open a new terminal session and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install UI dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite hot-reloading dev server:
   ```bash
   npm run dev
   ```
Open your browser and navigate to the dev client address (usually **`http://localhost:3000`**).

---

## 👤 Author

- **Mohammad Tausif**
- [GitHub Profile](https://github.com/MohammadTausif) *(Feel free to add your profile url)*

---

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.
