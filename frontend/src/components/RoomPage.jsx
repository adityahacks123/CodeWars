import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const RoomPage = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isSpectator = new URLSearchParams(location.search).get('mode') === 'spectator';
  const socket = useSocket();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetchRoomDetails();
  }, [roomCode]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !roomCode) return;

    // Join the socket room
    socket.emit('join_room', roomCode);

    // Listen for new users
    socket.on('user_joined', ({ userId }) => {
      console.log('User joined event received:', userId);
      // Refresh room details to get full user info
      fetchRoomDetails();
      setNotification('A new challenger appeared!');
      setTimeout(() => setNotification(null), 3000);
    });

    // Listen for users leaving
    socket.on('user_left', ({ userId }) => {
      fetchRoomDetails();
      setNotification('A player left the room.');
      setTimeout(() => setNotification(null), 3000);
    });

    // Listen for battle start
    socket.on('battle_started', ({ questionId }) => {
      navigate(`/coding/${questionId}?roomCode=${roomCode}${isSpectator ? '&mode=spectator' : ''}`);
    });

    // Listen for room closing
    socket.on('room_closed', () => {
      alert('The host has closed the room.');
      navigate('/dashboard');
    });

    return () => {
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('battle_started');
      socket.off('room_closed');
      socket.emit('leave_room', roomCode);
    };
  }, [socket, roomCode, navigate]);

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

        // Check if coding session has started (for late joiners or refreshes)
        if (currentRoom.status === 'coding' && currentRoom.question) {
          navigate(`/coding/${currentRoom.question._id}?roomCode=${roomCode}${isSpectator ? '&mode=spectator' : ''}`);
          return;
        }

        setRoom(currentRoom);
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

  const handleLeaveRoom = () => {
    setShowLeaveConfirm(true);
  };

  const confirmLeaveRoom = async () => {
    try {
      setIsLeaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ROOMS}/${roomCode}/leave`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setNotification('You have left the room');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setError(data.message || 'Failed to leave room');
        setShowLeaveConfirm(false);
      }
    } catch (err) {
      console.error('Error leaving room:', err);
      setError('Error leaving room: ' + err.message);
      setShowLeaveConfirm(false);
    } finally {
      setIsLeaving(false);
    }
  };

  const cancelLeaveRoom = () => {
    setShowLeaveConfirm(false);
  };

  const handleCloseRoom = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ROOMS}/${roomCode}/close`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        navigate('/dashboard');
      } else {
        setError(data.message || 'Failed to close room');
      }
    } catch (err) {
      console.error('Error closing room:', err);
      setError('Error closing room: ' + err.message);
    }
  };

  const handleStartCoding = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ROOMS}/${roomCode}/start`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Emit socket event to notify all participants
        if (socket && data.data.question) {
          socket.emit('start_battle', {
            roomCode,
            questionId: data.data.question._id
          });
        }
        // Update room status locally
        setRoom(data.data);
        // Navigate to coding page
        if (data.data.question) {
          navigate(`/coding/${data.data.question._id}?roomCode=${roomCode}`);
        }
      } else {
        setError(data.message || 'Failed to start coding session');
      }
    } catch (err) {
      console.error('Error starting coding session:', err);
      setError('Error starting coding session: ' + err.message);
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

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1f3a] border border-gray-700 rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2m0-12a9 9 0 110 18 9 9 0 010-18z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Leave Room?</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to leave this room? You can rejoin later using the room code.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelLeaveRoom}
                disabled={isLeaving}
                className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white py-2 rounded-lg transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmLeaveRoom}
                disabled={isLeaving}
                className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white py-2 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
              >
                {isLeaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Leaving...
                  </>
                ) : (
                  'Leave Room'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-cyan-400">Room Code</h2>
                {isSpectator && (
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/50 rounded-full text-sm font-semibold animate-pulse">
                    👁️ Spectating
                  </span>
                )}
              </div>
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
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${room.question.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
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
              {!isSpectator && (
                <button
                  onClick={handleStartCoding}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Start Coding
                </button>
              )}
              {isSpectator && (
                <div className="w-full bg-gray-700/50 text-gray-300 font-semibold py-3 rounded-lg text-center border border-gray-600">
                  Waiting for host to start...
                </div>
              )}
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

              {/* Leave/Close Room */}
              {isHost ? (
                <button
                  onClick={handleCloseRoom}
                  className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors text-sm font-semibold"
                >
                  Close Room
                </button>
              ) : (
                <button
                  onClick={handleLeaveRoom}
                  className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg transition-colors text-sm font-semibold"
                >
                  {isSpectator ? 'Stop Spectating' : 'Leave Room'}
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
