import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const RoomPage = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState(null);
  const [previousParticipantCount, setPreviousParticipantCount] = useState(0);
  const [newJoinedUser, setNewJoinedUser] = useState(null);

  useEffect(() => {
    fetchRoomDetails();
    
    // Poll for room updates every 2 seconds
    const interval = setInterval(() => {
      fetchRoomDetails();
    }, 2000);

    return () => clearInterval(interval);
  }, [roomCode]);

  const fetchRoomDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ROOMS}/${roomCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch room details');
      }

      const data = await response.json();
      if (data.success) {
        const currentRoom = data.data;
        
        // Check if new participant joined
        if (room && currentRoom.participants.length > previousParticipantCount) {
          // Find the new participant
          const currentParticipantIds = room.participants.map(p => p.user._id);
          const newParticipant = currentRoom.participants.find(
            p => !currentParticipantIds.includes(p.user._id)
          );
          
          if (newParticipant) {
            setNewJoinedUser(newParticipant.user);
            setNotification(`${newParticipant.user.name} joined the room!`);
            
            // Auto-hide notification after 4 seconds
            setTimeout(() => {
              setNotification(null);
              setNewJoinedUser(null);
            }, 4000);
          }
        }
        
        setRoom(currentRoom);
        setPreviousParticipantCount(currentRoom.participants.length);
      } else {
        setError(data.message || 'Failed to load room');
      }
    } catch (err) {
      console.error('Error fetching room:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const inviteLink = `${window.location.origin}/join-room/${roomCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ROOMS}/${roomCode}/close`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error leaving room:', err);
    }
  };

  const handleStartCoding = () => {
    if (room && room.question) {
      navigate(`/coding/${room.question._id}?roomCode=${roomCode}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2040] flex items-center justify-center">
        <div className="text-white text-xl">Loading room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2040] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  const isHost = room.host._id === JSON.parse(localStorage.getItem('user') || '{}')._id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] via-[#1a2040] to-[#2a3f5f] text-white">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-purple-500/10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-cyan-500/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-radial from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      {/* Notification Popup */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-sm border border-green-400/50 rounded-lg px-6 py-4 shadow-2xl shadow-green-500/50 flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white">{notification}</p>
              {newJoinedUser && (
                <p className="text-sm text-green-100 mt-1">{newJoinedUser.email}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#0a0e27]/80 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-cyan-500 rounded-lg p-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <span className="text-white text-xl font-bold">CodeArena</span>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section - Room Info */}
          <div className="lg:col-span-2">
            {/* Room Code Card */}
            <div className="bg-[#1a1f3a]/90 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-8 mb-8">
              <h2 className="text-3xl font-bold mb-6 text-cyan-400">Room Code</h2>
              <div className="flex items-center gap-4">
                <div className="bg-[#0f1425] border-2 border-cyan-500 rounded-lg px-8 py-4">
                  <div className="text-5xl font-bold text-cyan-400 tracking-widest font-mono">
                    {room.roomCode}
                  </div>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-[#1a1f3a]/90 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 mb-8">
              <h3 className="text-2xl font-bold mb-4">Problem</h3>
              <div className="mb-4">
                <h4 className="text-xl font-semibold text-cyan-400 mb-2">{room.question.title}</h4>
                <p className="text-gray-300 mb-4">{room.question.description}</p>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    room.question.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                    room.question.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {room.question.difficulty}
                  </span>
                  {room.question.topics && room.question.topics.map(topic => (
                    <span key={topic} className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-300">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleStartCoding}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Start Coding
              </button>
            </div>
          </div>

          {/* Right Section - Participants */}
          <div>
            <div className="bg-[#1a1f3a]/90 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 sticky top-8">
              <h3 className="text-2xl font-bold mb-6">Participants ({room.participants.length})</h3>
              
              <div className="space-y-4 mb-8">
                {room.participants.map((participant, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-[#0f1425] rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold">
                        {participant.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{participant.user.name}</p>
                      <p className="text-xs text-gray-400">
                        {participant.user._id === room.host._id ? 'Host' : 'Guest'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Invite Section */}
              <div className="border-t border-gray-700 pt-6">
                <h4 className="font-semibold mb-4">Invite Friends</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Share this room code with your friends to invite them
                </p>
                <div className="bg-[#0f1425] border border-gray-700 rounded-lg p-4 mb-4">
                  <p className="text-center text-2xl font-mono font-bold text-cyan-400">
                    {room.roomCode}
                  </p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors text-sm font-semibold"
                >
                  {copied ? '✓ Link Copied' : 'Copy Invite Link'}
                </button>
              </div>

              {/* Leave Room */}
              {isHost && (
                <button
                  onClick={handleLeaveRoom}
                  className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors text-sm font-semibold"
                >
                  Close Room
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
