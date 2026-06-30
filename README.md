# FixIt 🛠️

> **From Photo to Action — AI-powered civic reporting with autonomous escalation.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Firebase%20Hosting-orange?style=for-the-badge\&logo=firebase)](https://fixit-d2040.web.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge\&logo=github)](https://github.com/Pratyush0206/Fixit)
[![Gemini AI](https://img.shields.io/badge/Powered%20by-Gemini%202.5%20Flash-blue?style=for-the-badge\&logo=google)](https://aistudio.google.com)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)

---

# 🏆 Vibe2Ship Hackathon Submission

**Problem Statement:** Community Hero — Hyperlocal Problem Solver

**Hackathon:** Coding Ninjas × Google for Developers

---

# 🌍 The Problem

Citizens frequently encounter civic problems like:

* 🕳️ Potholes
* 💡 Broken streetlights
* 🚰 Water leakages
* 🗑️ Garbage dumps
* 🚧 Damaged public infrastructure

Existing complaint systems suffer from:

* Manual reporting
* Duplicate complaints
* Poor prioritization
* Low citizen engagement
* Slow escalation
* No intelligent insights

---

# 💡 What is FixIt?

**FixIt is an AI-powered civic intelligence platform that transforms a simple photograph into an actionable civic complaint.**

Instead of asking citizens to manually classify issues or determine the responsible department, FixIt uses **Gemini AI** to understand the uploaded image, determine the issue category, estimate severity, and generate a meaningful summary.

The issue is immediately placed on an interactive map where nearby duplicate complaints are intelligently detected. Rather than allowing redundant reports, FixIt encourages community verification to build consensus around genuine problems.

As citizens continue verifying an issue, **FixIt continuously monitors Firestore events. Once the verification threshold is reached, an autonomous AI workflow is triggered without any manual intervention. The system automatically generates a formal complaint letter, updates the issue status to Escalated, and prevents further duplicate reporting.**

FixIt doesn't just collect complaints—it actively assists citizens by understanding issues, preventing duplicate reports, coordinating community verification, autonomously escalating verified complaints, and providing actionable civic intelligence through AI.

---

# 🚀 Live Deployment

🔥 **Firebase Hosting (Google Cloud Platform)**

https://fixit-d2040.web.app

▲ **Vercel Mirror**

https://fixit-nine-sand.vercel.app

> **Google Cloud Deployment:** Frontend deployed on **Firebase Hosting**, leveraging the underlying **Google Cloud Global CDN and Google Cloud Storage infrastructure** to ensure scalable, production-grade, low-latency delivery worldwide.

---

# ✨ Features

## 🤖 AI-Powered Image Analysis

Upload an image and Gemini automatically:

* Validates whether it is a genuine civic issue
* Rejects spam images (selfies, pets, food, etc.)
* Categorizes the issue
* Estimates severity
* Generates an AI summary

---

## 🔍 Intelligent Duplicate Detection

Before creating a complaint:

* Searches for similar nearby issues within **80 meters**
* Prevents duplicate complaints
* Allows citizens to verify existing issues instead
* Automatically blocks reporting if the issue has already been escalated

---

## 🗺️ Smart Interactive Map

* Live issue visualization
* GPS-based issue locations
* Smart marker offset system prevents overlapping pins
* Original coordinates preserved for accurate duplicate detection

---

## 👍 Community Verification

Citizens strengthen complaint credibility through verification.

Features:

* One verification per citizen
* Cannot verify own report
* Duplicate verification prevented
* Verification counts maintained in Firestore

---

## 🚨 Autonomous Escalation Agent *(Core Agentic AI Feature)*

This is the core intelligence behind FixIt.

The platform continuously observes community verification activity stored in Firebase Firestore.

Once an issue receives **3 independent citizen verifications**, an autonomous workflow is triggered.

Without requiring any user action, the AI agent:

* Observes verification threshold
* Reasons that sufficient community consensus exists
* Generates a formal complaint letter using Gemini
* Updates the issue status to **Escalated**
* Prevents redundant future reports

This demonstrates a complete **Observe → Reason → Act** autonomous workflow.

---

## 📄 AI Complaint Letter Generation

Once escalated, Gemini automatically drafts an official complaint containing:

* Citizen name
* Date
* Location
* Issue description
* Severity
* Community verification count

The document is immediately available inside the application.

---

## 📊 AI Community Insights

Gemini analyzes all reported issues and generates:

* 📍 Hotspot Detection
* 📈 Complaint Trends
* ⚡ Priority Recommendations
* 🏢 Department Mapping
* 🚨 Risk Alerts

Insights are cached inside Firestore and refreshable on demand.

---

## 🏆 Gamification & Leaderboard

Encourages community participation.

### Points

📝 Report Issue → **+10**

👍 Verify Issue → **+5**

Leaderboard displays:

* Top contributors
* Reports
* Verifications
* Total points
* Highlighted current user

---

## ✅ Resolution Tracking

FixIt supports a complete issue lifecycle.

Issues can be marked as **Resolved** after successful action has been taken.

This allows citizens to distinguish between active and completed civic complaints.

---

# 📌 Issue Lifecycle

```text
Reported
      ↓
Community Verification
      ↓
Escalated
      ↓
Resolved
```

---

# 🧠 Why Gemini?

Gemini acts as the reasoning engine behind FixIt.

It is responsible for:

* Image validation
* Civic issue classification
* Severity estimation
* AI summaries
* Complaint letter generation
* AI Insights
* Department recommendation
* Risk alerts

Rather than functioning as a chatbot, Gemini powers multiple intelligent workflows throughout the platform.

---

# 🚀 Innovation

Traditional civic complaint systems simply store reports.

FixIt transforms civic reporting into an intelligent workflow by combining:

* Computer Vision
* Community Consensus
* Geospatial Duplicate Detection
* Autonomous AI Decision Making
* AI-generated Government Documentation
* Gamified Citizen Participation

The result is a smarter reporting ecosystem that reduces duplicate complaints while helping authorities prioritize genuine community issues.

---

# 🛠 Tech Stack

| Technology         | Purpose                  |
| ------------------ | ------------------------ |
| React.js           | Interactive frontend     |
| Tailwind CSS       | Responsive UI            |
| Leaflet.js         | Interactive maps         |
| OpenStreetMap      | Map tiles                |
| Gemini 2.5 Flash   | AI reasoning engine      |
| Firebase Firestore | Real-time cloud database |
| Firebase Hosting   | Production deployment    |
| GitHub             | Version control          |

---

# 🔑 Google Technologies Utilized

* **Google AI Studio** — Gemini API management
* **Gemini 2.5 Flash** — Image understanding, issue classification, severity estimation, complaint generation, AI Insights, image validation
* **Firebase Firestore** — Real-time NoSQL database for issues, users, leaderboard, and insights
* **Firebase Hosting** — Frontend deployed on Firebase Hosting, leveraging the underlying Google Cloud Global CDN and Google Cloud Storage infrastructure to ensure scalable, production-grade delivery.

---

# 🏗 System Architecture

```text
Citizen uploads image
          │
          ▼
Gemini validates image
          │
          ▼
Issue Classification
          │
          ▼
Duplicate Detection (80m)
          │
     ┌────┴────┐
     │         │
Duplicate   New Report
Found         │
     │         ▼
Verify    Store in Firestore
     │         │
     └────► Community Verification
                    │
          3 Independent Verifications
                    │
                    ▼
      Autonomous Escalation Agent
                    │
                    ▼
 Gemini Generates Complaint Letter
                    │
                    ▼
     Status → Escalated
                    │
                    ▼
        Mark as Resolved
```

---

# 🚀 Run Locally

```bash
git clone https://github.com/Pratyush0206/Fixit.git
cd Fixit
npm install
```

Create a `.env` file:

```env
REACT_APP_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Run:

```bash
npm start
```

Application runs on:

```text
http://localhost:3000
```

---

# 📁 Project Structure

```text
src/
├── App.js
├── firebase.js
├── index.js
└── index.css
```

---

# 🔮 Future Roadmap

* Government API integration
* Push notifications
* Mobile application
* Authority dashboard
* AI-based image similarity detection
* Multilingual support
* Predictive civic analytics

---

# 👨‍💻 Author

**Pratyush Prasad**


Built for the **Google × Coding Ninjas Vibe2Ship Hackathon 2026**

---

> **Empowering communities through AI-driven civic collaboration.**
