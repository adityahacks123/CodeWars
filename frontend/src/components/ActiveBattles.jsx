import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { useSocket } from '../context/SocketContext';
import Navbar from './Navbar';

const ActiveBattles = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const [user, setUser] = useState(null);
  const [activeBattles, setActiveBattles] = useState([]);
  const [liveUpdates, setLiveUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [spectateModal, setSpectateModal] = useState({ isOpen: false, battle: null });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    }

    const fetchActiveBattles = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.ROOMS}/active`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setActiveBattles(data.data);
        }
      } catch (error) {
        console.error('Error fetching active battles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveBattles();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchActiveBattles, 10000);

    // Client-side timer to update countdown every second
    const timerInterval = setInterval(() => {
      setActiveBattles(prevBattles => prevBattles.map(battle => {
        // If time is not in MM:SS format (e.g. "Waiting..."), don't update
        if (!battle.timeLeft.includes(':')) return battle;

        const [mins, secs] = battle.timeLeft.split(':').map(Number);
        if (isNaN(mins) || isNaN(secs)) return battle;

        if (mins === 0 && secs === 0) return battle;

        let newSecs = secs - 1;
        let newMins = mins;

        if (newSecs < 0) {
          newSecs = 59;
          newMins -= 1;
        }

        if (newMins < 0) return { ...battle, timeLeft: '00:00' };

        return {
          ...battle,
          timeLeft: `${newMins.toString().padStart(2, '0')}:${newSecs.toString().padStart(2, '0')}`
        };
      }));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, [navigate]);

  // Socket.io: Subscribe to real-time progress updates
  useEffect(() => {
    if (!socket) return;

    socket.on('opponent_progress', ({ user, passedTests, totalTests }) => {
      setLiveUpdates(prev => ({
        ...prev,
        [user._id]: {
          passedTests,
          totalTests,
          percentage: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
        }
      }));
    });

    return () => {
      socket.off('opponent_progress');
    };
  }, [socket]);

  const [joinCode, setJoinCode] = useState('');

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      // First check if room exists and is active
      const response = await fetch(`${API_ENDPOINTS.ROOMS}/${joinCode}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      if (data.success) {
        navigate(`/room/${joinCode}`);
      } else {
        alert('Room not found or inactive');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room');
    }
  };

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
      case 'Easy': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getLanguageIcon = (language) => {
    switch (language) {
      case 'JavaScript': return '🟨';
      case 'Python': return '🐍';
      case 'Java': return '☕';
      case 'C++': return '⚡';
      default: return '💻';
    }
  };

  const joinBattle = (roomCode) => {
    // Navigate to room page
    navigate(`/room/${roomCode}`);
  };

  const openSpectateModal = (battle) => {
    setSpectateModal({ isOpen: true, battle });
  };

  const closeSpectateModal = () => {
    setSpectateModal({ isOpen: false, battle: null });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'solving': return 'text-green-400';
      case 'testing': return 'text-yellow-400';
      case 'idle': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'solving': return '⚡';
      case 'testing': return '🧪';
      case 'idle': return '💤';
      default: return '💻';
    }
  };

  // Merge live socket updates with fetched battle data
  const battlesWithLiveData = activeBattles.map(battle => ({
    ...battle,
    participantsList: battle.participantsList?.map(p => ({
      ...p,
      ...(liveUpdates[p.id] || {})  // Overlay live data if available
    }))
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] via-[#1a2040] to-[#2a3f5f] text-white relative overflow-hidden">
      {/* Background gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-purple-500/10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-cyan-500/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-radial from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-cyan-400">ACTIVE</span> BATTLES
          </h1>
          <p className="text-gray-300 text-lg">
            Join live coding competitions and compete with developers worldwide
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-green-400 font-semibold">{activeBattles.length} Live Battles</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-cyan-400 font-semibold">
                {activeBattles.reduce((total, battle) => total + battle.participants, 0)} Active Players
              </span>
            </div>
          </div>
        </div >

        {/* Loading State */}
        {
          loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
              <span className="ml-4 text-gray-300">Loading active battles...</span>
            </div>
          ) : (
            /* Battles Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {battlesWithLiveData.map((battle) => (
                <div
                  key={battle.id}
                  className="bg-[#1a1f3a]/90 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/20"
                >
                  {/* Battle Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getLanguageIcon(battle.language)}</span>
                      <div>
                        <h3 className="text-lg font-bold text-white">{battle.title}</h3>
                        <p className="text-sm text-gray-400">{battle.language}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(battle.difficulty)}`}>
                      {battle.difficulty}
                    </div>
                  </div>

                  {/* Battle Stats */}
                  <div className="space-y-3 mb-6">
                    {/* Participants */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-gray-300 text-sm">Players</span>
                      </div>
                      <span className="text-white font-semibold">
                        {battle.participants}/{battle.maxParticipants}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(battle.participants / battle.maxParticipants) * 100}%` }}
                      ></div>
                    </div>

                    {/* Time Left */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-300 text-sm">Time Left</span>
                      </div>
                      <span className="text-yellow-400 font-semibold font-mono">
                        {battle.timeLeft}
                      </span>
                    </div>

                    {/* Prize */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span className="text-gray-300 text-sm">Prize</span>
                      </div>
                      <span className="text-purple-400 font-semibold">
                        {battle.prize}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/room/${battle.roomCode}?mode=spectator`)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Spectate
                    </button>
                    {battle.participants >= battle.maxParticipants ? (
                      <button
                        disabled
                        className="flex-1 bg-gray-600 text-gray-400 cursor-not-allowed font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Full
                      </button>
                    ) : battle.timeLeft === '00:00' ? (
                      <button
                        disabled
                        className="flex-1 bg-red-900/50 text-red-200 cursor-not-allowed font-semibold py-3 px-4 rounded-lg"
                      >
                        Ended
                      </button>
                    ) : (
                      <button
                        onClick={() => joinBattle(battle.roomCode)}
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                      >
                        Join Battle
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        }

        {/* Empty State */}
        {
          !loading && activeBattles.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">⚔️</div>
              <h3 className="text-2xl font-bold mb-4">No Active Battles</h3>
              <p className="text-gray-400 mb-8">
                There are no active battles right now. Check back later or create your own room!
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
              >
                Create New Battle
              </button>
            </div>
          )
        }
        {/* Spectate Modal */}
        {
          spectateModal.isOpen && spectateModal.battle && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#1a1f3a] border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{getLanguageIcon(spectateModal.battle.language)}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{spectateModal.battle.title}</h2>
                      <div className="flex items-center gap-4 mt-1">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(spectateModal.battle.difficulty)}`}>
                          {spectateModal.battle.difficulty}
                        </div>
                        <span className="text-gray-400">{spectateModal.battle.language}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-green-400 text-sm font-semibold">Live</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeSpectateModal}
                    className="text-gray-400 hover:text-white transition-colors p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Battle Info */}
                    <div className="space-y-6">
                      <div className="bg-[#0f1425] rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4 text-cyan-400">Battle Information</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Time Remaining</span>
                            <span className="text-yellow-400 font-mono font-semibold">{spectateModal.battle.timeLeft}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Participants</span>
                            <span className="text-white font-semibold">{spectateModal.battle.participants}/{spectateModal.battle.maxParticipants}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Prize Pool</span>
                            <span className="text-purple-400 font-semibold">{spectateModal.battle.prize}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Language</span>
                            <span className="text-white font-semibold">{spectateModal.battle.language}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#0f1425] rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4 text-cyan-400">Battle Stats</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Average Score</span>
                            <span className="text-white font-semibold">187</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Submissions</span>
                            <span className="text-white font-semibold">23</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Success Rate</span>
                            <span className="text-green-400 font-semibold">68%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Participants List */}
                    <div className="bg-[#0f1425] rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4 text-cyan-400">Live Participants</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {spectateModal.battle.participantsList?.map((participant, index) => (
                          <div key={participant.id} className="flex items-center justify-between p-3 bg-[#1a1f3a] rounded-lg hover:bg-[#1e2347] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-sm font-mono w-6">#{participant.rank}</span>
                                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                  {participant.avatar}
                                </div>
                              </div>
                              <div>
                                <div className="text-white font-semibold">{participant.name}</div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs ${getStatusColor(participant.status)}`}>
                                    {getStatusIcon(participant.status)} {participant.status}
                                  </span>
                                </div>
                                {/* Progress Bar */}
                                {participant.totalTests > 0 && (
                                  <div className="mt-2 w-32">
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                      <span>{participant.passedTests}/{participant.totalTests}</span>
                                      <span>{participant.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                                      <div
                                        className="bg-gradient-to-r from-green-500 to-cyan-500 h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${participant.percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold">{participant.score}</div>
                              <div className="text-gray-400 text-xs">points</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 mt-6 pt-6 border-t border-gray-700">
                    <button
                      onClick={() => {
                        closeSpectateModal();
                        joinBattle(spectateModal.battle.id);
                      }}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                    >
                      Join This Battle
                    </button>
                    <button
                      onClick={closeSpectateModal}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      </div >
    </div >
  );
};

export default ActiveBattles;
