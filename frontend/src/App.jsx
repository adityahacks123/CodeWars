import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import TargetPage from './components/TargetPage'
import CodingPlatform from './components/CodingPlatform'
import ProblemsPage from './components/ProblemsPage'
import Profile from './components/Profile'
import ProfileTest from './components/ProfileTest'
import ActiveBattles from './components/ActiveBattles'
import RoomPage from './components/RoomPage'
import JoinRoom from './components/JoinRoom'
import SubmissionsPage from './components/SubmissionsPage'
import AboutUs from './components/AboutUs'
import Leaderboard from './components/Leaderboard'

import SettingsPage from './components/SettingsPage'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<TargetPage />} />
          <Route path="/active-battles" element={<ActiveBattles />} />
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile-test" element={<ProfileTest />} />
          <Route path="/coding/:questionId" element={<CodingPlatform />} />
          <Route path="/submissions" element={<SubmissionsPage />} />
          <Route path="/room/:roomCode" element={<RoomPage />} />
          <Route path="/join-room/:roomCode" element={<JoinRoom />} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
