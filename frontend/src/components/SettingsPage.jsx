import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from './Navbar';

const SettingsPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile State
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        bio: '',
        avatar: ''
    });

    // Password State
    const [password, setPassword] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:3001/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setProfile({
                    name: data.user.name || '',
                    email: data.user.email || '',
                    bio: data.user.bio || '',
                    avatar: data.user.avatar || ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: profile.name,
                    bio: profile.bio,
                    avatar: profile.avatar
                })
            });

            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                // Update local storage user data if needed
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({ ...user, name: profile.name, avatar: profile.avatar }));
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Server error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (password.newPassword !== password.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/users/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: password.currentPassword,
                    newPassword: password.newPassword
                })
            });

            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to change password' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Server error occurred' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0e27] text-white">
            <Navbar />
            <div className="max-w-4xl mx-auto p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                        Settings
                    </h1>
                </div>

                <div className="bg-[#1a1f3a] rounded-xl border border-gray-700 overflow-hidden">
                    <div className="flex border-b border-gray-700">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-6 py-4 font-semibold transition-colors ${activeTab === 'profile'
                                ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            Profile Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`px-6 py-4 font-semibold transition-colors ${activeTab === 'security'
                                ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            Security
                        </button>
                    </div>

                    <div className="p-8">
                        {message.text && (
                            <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'
                                }`}>
                                {message.text}
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Avatar URL</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 border-2 border-gray-600">
                                            {profile.avatar ? (
                                                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                                                    {profile.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="url"
                                            value={profile.avatar}
                                            onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                                            className="flex-1 bg-[#0f1425] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                            placeholder="https://example.com/avatar.jpg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        className="w-full bg-[#0f1425] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full bg-[#0f1425]/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                                    <textarea
                                        value={profile.bio}
                                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                        className="w-full bg-[#0f1425] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors h-32 resize-none"
                                        placeholder="Tell us about yourself..."
                                        maxLength={500}
                                    />
                                    <p className="text-xs text-gray-500 mt-1 text-right">{profile.bio.length}/500</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        )}

                        {activeTab === 'security' && (
                            <form onSubmit={handlePasswordChange} className="space-y-6 max-w-xl">
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                                    <p className="text-yellow-200 text-sm">
                                        ⚠️ If you signed up with Google, you cannot change your password here. Please use Google to manage your account security.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        value={password.currentPassword}
                                        onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })}
                                        className="w-full bg-[#0f1425] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        value={password.newPassword}
                                        onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
                                        className="w-full bg-[#0f1425] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={password.confirmPassword}
                                        onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
                                        className="w-full bg-[#0f1425] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
