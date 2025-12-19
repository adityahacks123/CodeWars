import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

import Navbar from './Navbar';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Alex Johnson', username: 'alexcodes' });
  const [userStats, setUserStats] = useState({
    totalProblemsSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    memberSince: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  });
  const [recentProblems, setRecentProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [contestHistory, setContestHistory] = useState([]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Get user from localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }

      // Fetch user stats from backend
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      // Get current user ID from auth
      const authResponse = await fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!authResponse.ok) {
        navigate('/');
        return;
      }

      const authData = await authResponse.json();
      // Handle both possible structures (data or user property)
      const userData = authData.data || authData.user;
      const userId = userData._id || userData.id;
      console.log('📊 Fetching stats for user:', userId);
      // Update user state with ID if not present
      setUser(prev => ({ ...prev, _id: userId }));

      // Fetch user stats
      const statsResponse = await fetch(`http://localhost:3001/api/user/${userId}/stats`);
      const statsData = await statsResponse.json();
      console.log('📊 Stats API Response:', statsData);

      if (statsData.success) {
        console.log('✅ Stats received:', statsData.data.stats);
        setUserStats({
          totalProblemsSolved: statsData.data.stats.totalProblemsSolved || 0,
          easySolved: statsData.data.stats.easySolved || 0,
          mediumSolved: statsData.data.stats.mediumSolved || 0,
          hardSolved: statsData.data.stats.hardSolved || 0,
          memberSince: new Date(statsData.data.user.memberSince).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        });

        // Set contest history from API
        if (statsData.data.battles) {
          setContestHistory(statsData.data.battles);
        }
      } else {
        console.error('❌ Stats API returned error:', statsData);
      }

      // Fetch solved problems from user-solved collection
      try {
        const solvedResponse = await fetch(`http://localhost:3001/api/user/${userId}/solved?limit=10`);
        const solvedData = await solvedResponse.json();
        console.log('📚 Solved Problems API Response:', solvedData);

        if (solvedData.success && solvedData.data && solvedData.data.length > 0) {
          const problems = solvedData.data.map(solved => ({
            name: solved.title || 'Unknown Problem',
            difficulty: solved.difficulty || 'Medium',
            category: solved.topic || 'General',
            timeSpent: solved.timeTaken ? `${Math.round(solved.timeTaken / 1000)} sec` : 'N/A',
            timeAgo: new Date(solved.solvedAt).toLocaleDateString(),
            status: 'Accepted',
            language: solved.language
          }));
          console.log('✅ Solved problems received:', problems);
          setRecentProblems(problems);
        } else {
          console.log('ℹ️ No solved problems found');
          setRecentProblems([]);
        }
      } catch (solvedError) {
        console.error('❌ Error fetching solved problems:', solvedError);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 Profile component mounted, fetching data...');
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(API_ENDPOINTS.LOGOUT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500 text-green-100';
      case 'Medium': return 'bg-yellow-500 text-yellow-100';
      case 'Hard': return 'bg-red-500 text-red-100';
      default: return 'bg-gray-500 text-gray-100';
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] via-[#1a2040] to-[#2a3f5f] text-white relative overflow-hidden">
      {/* Background gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-purple-500/10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-cyan-500/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-radial from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      {/* Navigation Bar */}
      <nav className="border-b border-gray-800 bg-[#0a0e27]/80 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-cyan-500 rounded-lg p-2 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <span className="text-white text-xl font-bold">CodeArena</span>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-8">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-300 hover:text-white transition-colors bg-none border-none cursor-pointer"
              >
                Dashboard 🏠
              </button>
              <button
                onClick={() => navigate('/problems')}
                className="text-gray-300 hover:text-white transition-colors bg-none border-none cursor-pointer"
              >
                Problems 📋
              </button>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                Challenges 📋
              </a>
              <Link
                to="/leaderboard"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Leaderboard 🏆
              </Link>
              <Link
                to="/about"
                className="text-gray-300 hover:text-white transition-colors"
              >
                About Us 📘
              </Link>
            </div>

            {/* Right Side Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={fetchUserData}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                title="Refresh stats"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-12 relative z-10">
        {/* Profile Header */}
        <div className="bg-[#1a1f3a]/90 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 mb-8">
          <div className="flex items-center gap-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 p-1">
                <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                  Gold Tier
                </span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {user?.name || user?.username || 'Alex Johnson'}
              </h1>
              <p className="text-gray-400 mb-4">@{user?.username || 'alexcodes'}</p>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-400 text-sm">Problems Solved</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{userStats.totalProblemsSolved}</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-400 text-sm">Easy Solved</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{userStats.easySolved}</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-400 text-sm">Medium Solved</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{userStats.mediumSolved}</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-400 text-sm">Hard Solved</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{userStats.hardSolved}</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-gray-400 text-sm">Member Since</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{userStats.memberSince}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Solved Problems */}
        <div className="bg-[#1a1f3a]/90 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Recently Solved Problems</h2>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-400">Loading...</div>
              </div>
            ) : recentProblems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400">No problems solved yet. Start solving problems to see them here!</div>
              </div>
            ) : (
              recentProblems.map((problem, index) => (
                <div
                  key={index}
                  className="bg-[#0f1425] border border-gray-700 rounded-lg p-4 hover:border-cyan-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{problem.name}</h3>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                        <span className="text-gray-400 text-sm">{problem.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-300 text-sm">{problem.timeSpent}</span>
                      </div>
                      <div className="text-gray-400 text-xs">{problem.timeAgo}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contest History */}
        <div className="bg-[#1a1f3a]/90 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Contest History</h2>
          </div>

          <div className="space-y-4">
            {contestHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚔️</div>
                <h3 className="text-2xl font-bold text-white mb-2">No Battle History</h3>
                <p className="text-gray-400 mb-6">
                  Join your first coding battle to see your history here!
                </p>
                <button
                  onClick={() => navigate('/active-battles')}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  Join a Battle
                </button>
              </div>
            ) : (
              contestHistory.map((contest, index) => (
                <div
                  key={index}
                  className="bg-[#0f1425] border border-gray-700 rounded-lg p-6 hover:border-cyan-500 transition-all duration-300"
                >
                  {/* Header with Problem and Status */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${contest.status === 'Won' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                        {contest.status === 'Won' ? (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{contest.questionTitle}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getDifficultyColor(contest.questionDifficulty)}`}>
                            {contest.questionDifficulty}
                          </span>
                          <span className="text-gray-400 text-xs">{contest.questionTopic}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-4 py-2 rounded-lg font-bold text-sm ${contest.status === 'Won'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                      {contest.status}
                    </span>
                  </div>

                  {/* Opponent Info */}
                  <div className="flex items-center gap-3 mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 p-0.5">
                      <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                        {contest.opponentAvatar ? (
                          <img src={contest.opponentAvatar} alt={contest.opponentName} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold">{contest.opponentName}</div>
                      <div className="text-gray-400 text-sm">@{contest.opponentUsername}</div>
                    </div>
                    <div className="text-gray-400 text-xs">
                      vs
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-800/30 rounded">
                      <div className="text-gray-400 text-xs mb-1">Your Score</div>
                      <div className="text-white font-bold text-lg">{contest.myScore || '-'}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800/30 rounded">
                      <div className="text-gray-400 text-xs mb-1">Opponent</div>
                      <div className="text-white font-bold text-lg">{contest.opponentScore || '-'}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800/30 rounded">
                      <div className="text-gray-400 text-xs mb-1">Duration</div>
                      <div className="text-white font-semibold text-sm">{contest.duration}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800/30 rounded">
                      <div className="text-gray-400 text-xs mb-1">XP Earned</div>
                      <div className="text-green-400 font-bold">+{contest.xpEarned}</div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-gray-700/50 flex justify-between items-center text-sm">
                    <span className="text-gray-400">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {contest.timeAgo}
                    </span>
                    <span className="text-gray-400">
                      Rank: <span className="text-white font-semibold">#{contest.rank}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Debug Info */}
        <div className="mt-8 p-4 bg-black/50 rounded text-xs font-mono text-gray-400">
          <p>Debug Info:</p>
          <p>User ID: {user?._id || 'Not set'}</p>
          <p>Stats: {JSON.stringify(userStats)}</p>
          <p>Recent Problems: {recentProblems.length}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
