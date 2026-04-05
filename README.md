# ⚔️ CodeArena

**CodeArena** is a modern, real-time competitive coding platform where developers can solve algorithmic challenges, compete in 1v1 battles, and track their progress on global leaderboards.

![CodeArena Banner](https://via.placeholder.com/1200x600/0a0e27/06b6d4?text=CodeArena+Platform)

## 🚀 Key Features

### 💻 Advanced Coding Environment
-   **Multi-Language Support**: Code in C++, Java, Python, and JavaScript.
-   **Monaco Editor**: Professional-grade editor with syntax highlighting and auto-completion (VS Code experience).
-   **Real-time Execution**: Instant code compilation and test case validation.

### ⚡ Real-time Battles
-   **1v1 Duels**: Challenge friends or random opponents to coding battles.
-   **Live Progress**: See your opponent's test case progress in real-time via Socket.io.
-   **Room System**: Create private rooms with custom difficulty settings.

### 📊 Progress & Social
-   **Global Leaderboard**: Compete for the top spot based on Elo ratings and problems solved.
-   **Detailed Profiles**: Visualize your solving history, difficulty distribution, and battle win rates with interactive charts.
-   **Experience System**: Earn XP and badges (e.g., "Gold Tier") as you level up.

### 🎨 Modern UX/UI
-   **Sleek Dark Mode**: A carefully crafted dark theme using a semantic color system (`#0a0e27` background, Cyan/Emerald accents).
-   **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices.
-   **Interactive Feedback**: Beautiful toast notifications and skeleton loading states.

---

## 🛠️ Tech Stack

### Frontend
-   **Framework**: React.js (Vite)
-   **Styling**: Tailwind CSS (Custom Design System)
-   **State Management**: React Hooks & Context
-   **Real-time**: Socket.io Client
-   **Charts**: Recharts
-   **Editor**: Monaco Editor React

### Backend
-   **Runtime**: Node.js & Express.js
-   **Database**: MongoDB (Mongoose)
-   **Authentication**: JWT & Google OAuth 2.0
-   **Real-time**: Socket.io Server
-   **Code Execution**: Isolated sandbox environment

---

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
-   Node.js (v16+)
-   MongoDB (Local or Atlas URI)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/CodeArena.git
cd CodeArena
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/codearena
JWT_SECRET=your_super_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

Start the server:
```bash
npm start
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the development server:
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser! 🚀

---

## 📂 Project Structure

```
CodeArena/
├── backend/            # Express.js Server
│   ├── config/         # DB & Passport Config
│   ├── controllers/    # Route Logic
│   ├── models/         # Mongoose Schemas
│   ├── routes/         # API Endpoints
│   ├── services/       # Business Logic (Execution, Socket)
│   └── index.js        # Entry Point
│
└── frontend/           # React Application
    ├── src/
    │   ├── components/ # Reusable UI Components
    │   ├── pages/      # Main Page Views
    │   ├── context/    # Global State
    │   └── utils/      # Helpers
    ├── tailwind.config.js # Design System Config
    └── index.css       # Global Styles & Fonts
```

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
