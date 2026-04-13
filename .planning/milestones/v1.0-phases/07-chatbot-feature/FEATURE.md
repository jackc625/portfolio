# 🧠 Portfolio Chatbot Feature — Summary

## 🎯 Goal
Add a chatbot to your portfolio that allows recruiters or visitors to ask questions about your background, projects, and technical experience.

---

## 💡 Core Idea
A small, focused AI assistant that:
- Answers questions specifically about you
- Uses curated portfolio data as its knowledge source
- Provides concise, factual, and professional responses

> It is not a general chatbot — it is scoped strictly to your portfolio.

---

## ⚙️ How It Works
- A chat UI is embedded on your site
- User submits a question
- Backend sends:
    - a strict system prompt
    - your portfolio data
    - the user’s question
- The model returns a short, grounded answer

---

## 🧱 Key Components
- Chat UI (frontend)
- API route (backend)
- Portfolio context (bio, skills, projects, etc.)
- LLM for generating responses

---

## 🧠 Behavior Rules
- Only answer using provided portfolio data
- Do not invent or exaggerate experience
- Keep responses short and professional
- Say “I don’t have that information” if unsure
- Redirect if question is unrelated to you

---

## ✅ Purpose / Value
- Makes your portfolio interactive and memorable
- Allows recruiters to quickly extract relevant information
- Demonstrates ability to build AI-powered features
- Showcases your projects and experience in a dynamic way

---

## 🚫 What It Is Not
- Not a replacement for your portfolio content
- Not a general-purpose AI assistant
- Not “trained” in the traditional sense
- Not meant for open-ended or unrelated questions

---

## 🧠 One-Line Summary
A controlled chatbot on your portfolio that answers questions about you using curated data, designed to present your experience and projects in an interactive, recruiter-friendly way.