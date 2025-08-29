# TalentMatch
TalentMatch is an AI-powered hiring platform that provides an efficient, accurate and streamlined hiring process for employers & general companies.

## Team Members
Ling Jing Jie, 
William Chai Tian Wei, 
Wong Xuan Rui, 
Mo Hangyu, 
Fong Yi Ann 

## Problem and Solution Summary
**Problem:** 
1. The HR of Repsol admits that manual resume screening takes a lot of time, slowing down the hiring process.
2. Onboarding processes at Repsol are still manual, leading to inefficiencies and lack of scalability.
3. HR and MD spend significant time personally conducting many interviews, reducing their availability for strategic tasks.

**Solution:**
1. **Smart Resume Screening (NLP + LLM)**
- Automates resume analysis using Natural Language Processing (NLP) and Large Language Models (LLMs) to extract key insights, highlight strengths/weaknesses, and rank candidates efficiently.
2. **Onboarding Workflow Automation + RAG-Powered AI Chatbot**
- Streamlines onboarding with drag-and-drop workflow automation and Retrieval-Augmented Generation (RAG)-based AI chatbot to provide accurate, instant responses to new hires.
3. **AI-Assisted Interview with Human Oversight**
- Conducts structured, AI-driven interviews that save HR/MD time while ensuring human review/validation of the interview content, improving efficiency without compromising quality.

## Technology Stack
Our project integrates Full-Stack Web Development, Machine Learning, and AI/LLM Models to optimize talent acquisition and onboarding.

**Frontend (Full Stack):**
- Next.js – Server-side rendering & routing for a smooth user experience
- React – Component-based UI development
- TypeScript – Strongly typed code for reliability and scalability
- Tailwind CSS – Rapid and responsive styling

**Backend & Database:**
- Supabase – Database and storage solution for handling candidate data and interview logs
- FastAPI (Python) – High-performance backend framework for serving ML models

**Machine Learning & AI:**
- Python (ML System) – Custom-trained model to predict whether a candidate will stay in the company for more than 1 year
- OpenAI GPT-4o Mini – Used for:
1. Smart Resume Screening (NLP + LLM) → Parsing resumes, generating summaries, and highlighting strengths/weaknesses
2. AI Voice Agent (Realtime Preview) → Conducting AI-assisted interviews with natural conversation flow
3. RAG-Powered Chatbot → Answering candidate queries accurately using retrieval-augmented generation(chatbot retrieves info from company docs or policies before answering)

## Setup Instructions

### Prerequisites
- Node.js 18.18+ or 20+ (recommended)
- npm 10+
- An OpenAI API key with access to GPT-4o/GPT-4o Realtime preview models

### 1) Clone and install
```bash
git clone https://github.com/Andersonnn7788/futurenotready01.git
cd futurenotready01
npm install
```

### 2) Configure environment variables
Create a file named `.env.local` in the repository root:

```bash
# Required: used by all AI features and API routes
OPENAI_API_KEY=sk-...

# Supabase setup
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

### 3) Run the app
```bash
npm run dev
# Open http://localhost:3000
```

## Reflection on Challenges & Learnings
**Challenges Faced:**

- **Resume Data Extraction:** Parsing resumes with different formats (PDF, DOCX, inconsistent structures) was difficult. Ensuring clean text for NLP/LLM processing required experimenting with multiple parsing libraries.

- **LLM Integration & Costs:** Integrating OpenAI GPT-4o mini and GPT-4o (Realtime Preview) required handling API rate limits, response delays, and cost management while still maintaining accuracy.

- **Voice Agent Stability:** Setting up the GPT voice-to-voice agent was challenging, especially syncing input/output streams without duplications or interruptions during interviews.

- **ML Model Deployment:** Training and serving our self-built ML model (candidate retention prediction) via FastAPI involved challenges in handling class imbalance, tuning hyperparameters, and ensuring low-latency inference.

- **System Integration:** Connecting multiple moving parts—frontend (Next.js + React), backend (FastAPI), database (Supabase), and AI models—required careful API design, data flow planning, and debugging cross-service communication.

**Key Learnings:**

- **Practical NLP + LLM Usage:** Learned how to combine traditional NLP with LLMs (GPT-4o mini) to build a hybrid pipeline that balances efficiency with deep contextual understanding.

- **Real-Time AI Voice Interaction:** Gained hands-on experience with GPT-4o Realtime Preview for building conversational AI agents that simulate interviews, while also learning how to mitigate technical glitches.

- **ML Model Deployment:** Strengthened skills in deploying machine learning models in production environments using FastAPI, improving model serving, API handling, and monitoring.

- **System Scalability & Design:** Understood the importance of modular architecture: separating resume screening, interview agent, and onboarding chatbot into distinct services made the system easier to debug and extend.

- **Teamwork & Hackathon Execution:** Learned to divide responsibilities effectively (frontend, backend, ML, statistics, planning), manage time pressure, and deliver a functional MVP within tight deadlines.

