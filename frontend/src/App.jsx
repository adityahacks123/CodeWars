import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Lazy load components
const LoginPage = lazy(() => import('./components/LoginPage'))
const RegisterPage = lazy(() => import('./components/RegisterPage'))
const TargetPage = lazy(() => import('./components/TargetPage'))
const CodingPlatform = lazy(() => import('./components/CodingPlatform'))
const ProblemsPage = lazy(() => import('./components/ProblemsPage'))
const Profile = lazy(() => import('./components/Profile'))
const ProfileTest = lazy(() => import('./components/ProfileTest'))
const ActiveBattles = lazy(() => import('./components/ActiveBattles'))
const RoomPage = lazy(() => import('./components/RoomPage'))
const JoinRoom = lazy(() => import('./components/JoinRoom'))
const SubmissionsPage = lazy(() => import('./components/SubmissionsPage'))
const AboutUs = lazy(() => import('./components/AboutUs'))
const Leaderboard = lazy(() => import('./components/Leaderboard'))
const SettingsPage = lazy(() => import('./components/SettingsPage'))

// Loading Fallback Component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
  </div>
)

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: {
                primary: '#22d3ee',
                secondary: '#1e293b',
              },
            },
          }}
        />
        <Suspense fallback={<LoadingSpinner />}>
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
        </Suspense>
      </div>
    </Router>
  )
}

export default App
