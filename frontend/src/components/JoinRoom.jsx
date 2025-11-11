import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const JoinRoom = () => {
  const { roomCode: urlRoomCode } = useParams();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState(urlRoomCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_ENDPOINTS.ROOMS}/${roomCode.toUpperCase()}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to join room');
        return;
      }

      if (data.success) {
        navigate(`/room/${roomCode.toUpperCase()}`);
      }
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2040] text-white flex items-center justify-center">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-purple-500/10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-cyan-500/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#1a1f3a]/90 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
          <div className="text-center mb-8">
            <div className="bg-cyan-500 rounded-lg p-3 w-fit mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Join Room</h1>
            <p className="text-gray-400">Enter the room code to join your friends</p>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g., ABC123"
                className="w-full bg-[#0f1425] border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500 text-center text-2xl font-mono tracking-widest"
                maxLength="6"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
