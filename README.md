# 🧠 LearnWeave – Collaborative AI-Powered Learning & Coding Platform

![LearnWeave Logo](https://learnweave.onrender.com/static/media/LEARNWEAVE.d5e7e8b8867fd334dab6.png)

> 🚀 Learn. Solve. Share. – Empowering learners through interactive coding challenges, AI-assisted problem-solving, and fun placement preparation tools.

---

### 🌐 Live Demo

👉 **[LearnWeave on Render](https://learnweave.onrender.com)**

> ⚠️ *Note:* The current version is hosted on Render (free tier). If the site occasionally slows or stops, please check back soon — we’re migrating to **AWS** for full-scale reliability and performance.

---

### 🧩 Project Overview

**LearnWeave** is a full-stack MERN web application designed to make collaborative learning engaging and intelligent.
It combines **AI-driven learning**, **coding collaboration**, and **placement preparation** — all under one platform.

💡 Whether you're learning new concepts, preparing for interviews, or exploring AI-powered assistance, LearnWeave weaves all aspects of growth into one experience.

#### ✨ Core Features

* 📚 **Interactive Learning Modules:** Learn technologies, frameworks, and concepts through structured roadmaps.
* 💻 **AI-Assisted Coding Practice:** Get real-time AI guidance if you’re stuck on a problem.
* 🧩 **Challenges & Solutions:** Post coding challenges, explore others’ solutions, and learn collaboratively.
* 🤖 **AI-Powered Resume & ATS Tools:** Generate ATS-friendly resumes, analyze scores, and auto-generate LaTeX codes.
* 🎯 **Placement Zone ("Chill Room")**:

  * Aptitude Practice 🧮
  * Communication Skill Builders 🗣️
  * Programming Resources 💡
  * Sudoku & Chess Games ♟️ for stress-free breaks
* 🧠 **Community & Sharing:** View solutions, learn collaboratively, and connect through AI-generated insights.
* 🪄 **AI Everywhere:** From resume feedback to problem-solving hints — everything is powered by AI.

---

### ⚙️ Tech Stack

#### **Frontend**

* React.js (CRA)
* React Router DOM
* Axios
* Lucide React Icons
* HTML-to-Image, jsPDF, docx (Resume Generator)
* Responsive Design with CSS3

#### **Backend**

* Node.js + Express.js
* JWT Authentication
* Nodemailer (for OTP & password reset)
* Multer (for uploads)
* Mongoose + MongoDB Atlas
* Helmet & CORS for security

#### **Database**

* MongoDB (Atlas Cloud)

#### **AI Integrations**

* OpenAI API (text analysis & assistance)
* RapidAPI tools (Resume/ATS processing)

#### **Deployment**

* Render (Fullstack deployment)
* AWS (upcoming migration for scalability)

---

### 📁 Folder Structure

```
LEARNWEAVE/
│
├── learnweave/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # React Components & Pages
│   │   │   ├── Authpage.js     # Authentication (Login/Signup/OTP)
│   │   │   ├── Dashboardpage.js
│   │   │   ├── CodingPractice.js
│   │   │   ├── ResumeAnalyzer.js
│   │   │   ├── Placementpage.js (Chill Room, Aptitude, Chess, Sudoku)
│   │   │   └── server.js       # Express Backend APIs
│   └── package.json
│
├── package.json                # Root configuration
└── README.md
```

---

### 🔐 Environment Variables

Create a `.env` file in your backend directory:

```
NODE_ENV=production
PORT=10000
MONGO_URI=your_mongodb_connection_string
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
JWT_SECRET=your_secret_key
RAPIDAPI_KEY=your_rapidapi_key
OPENAI_API_KEY=your_openai_key
REACT_APP_API_URL=https://learnweave.onrender.com
```

---

### 🧮 Installation & Local Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/ganta-mukesh/learnweave.git
   cd learnweave
   ```

2. **Install dependencies**

   ```bash
   npm install
   cd learnweave
   npm install
   cd ..
   ```

3. **Run in development**

   ```bash
   npm run backend-dev    # Start backend with nodemon
   npm start              # Start frontend
   ```

4. **Production Build**

   ```bash
   npm run build
   node src/components/server.js
   ```

---

### 🌈 Key Features Summary

✅ User Authentication (Signup, Login, OTP Verification, Forgot Password)
✅ Real-time Coding Practice with AI help
✅ Resume Analyzer + ATS Score Checker
✅ AI-powered LaTeX Resume Generator
✅ Placement Preparation + Aptitude & Communication Resources
✅ Built-in Sudoku & Chess Games in Chill Room
✅ Challenge Posting & Community Solutions
✅ Admin Dashboard & User Analytics
✅ Hosted Fullstack on Render, migrating to AWS soon 🚀

---

### 🤝 Contributing

Pull requests are welcome!
For major changes, please open an issue first to discuss what you’d like to change.

---

### 👨‍💻 Author

**👤 Ganta Mukesh**
🎓 Student | MERN Stack & AI Developer
💬 Passionate about building AI-driven learning ecosystems.
📧 [learnweave.org@gmail.com](mailto:learnweave.org@gmail.com)
🌐 [LinkedIn](https://linkedin.com/in/ganta-mukesh)

---

### ⭐ Acknowledgments

* [Render](https://render.com) – Hosting & Deployment
* [MongoDB Atlas](https://www.mongodb.com/atlas) – Database Hosting
* [OpenAI](https://platform.openai.com) – AI-powered modules
* [RapidAPI](https://rapidapi.com) – Resume/ATS integrations
* [React Community](https://react.dev) – Frontend ecosystem

---

### 🏁 License

🆓 Free to Use

This project is free for everyone to use and explore.
However, no modifications, redistributions, or commercial use are permitted without prior permission from the creator.

🤝 Contributing

This project is open for learning but not open for modification or redistribution.
If you want to suggest new features or collaborate officially, please contact the creator.
---

> 💡 *Note:* We are currently improving LearnWeave to migrate to **AWS**, ensuring faster performance, persistent uptime, and global scalability — making AI-powered learning accessible for everyone!
