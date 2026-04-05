import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
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

    // Notification Preferences State
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false
    });

    // Email Change State
    const [emailChange, setEmailChange] = useState({
        newEmail: '',
        password: '',
        isEditing: false
    });

    // Delete Account State
    const [deleteAccount, setDeleteAccount] = useState({
        isOpen: false,
        password: '',
        confirmText: ''
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

            const response = await fetch(API_ENDPOINTS.ME, {
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
                if (data.user.notificationPreferences) {
                    setNotifications(data.user.notificationPreferences);
                }
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
            const response = await fetch(API_ENDPOINTS.UPDATE_PROFILE, {
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
            const response = await fetch(API_ENDPOINTS.CHANGE_PASSWORD, {
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

    const handleEmailChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_ENDPOINTS.CHANGE_EMAIL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: emailChange.newEmail,
                    password: emailChange.password
                })
            });

            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Email updated successfully!' });
                setProfile({ ...profile, email: emailChange.newEmail });
                setEmailChange({ newEmail: '', password: '', isEditing: false });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update email' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Server error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationUpdate = async (newPrefs) => {
        setNotifications(newPrefs);
        try {
            const token = localStorage.getItem('token');
            await fetch(API_ENDPOINTS.NOTIFICATIONS, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newPrefs)
            });
        } catch (error) {
            console.error('Error updating notifications:', error);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteAccount.confirmText !== 'DELETE') {
            setMessage({ type: 'error', text: 'Please type DELETE to confirm' });
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(API_ENDPOINTS.DELETE_ACCOUNT, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    password: deleteAccount.password
                })
            });

            const data = await response.json();
            if (data.success) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to delete account' });
                setLoading(false);
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Server error occurred' });
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
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`px-6 py-4 font-semibold transition-colors ${activeTab === 'notifications'
                                ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            Notifications
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
                                    {!emailChange.isEditing ? (
                                        <div className="flex gap-4">
                                            <input
                                                type="email"
                                                value={profile.email}
                                                disabled
                                                className="w-full bg-[#0f1425]/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setEmailChange({ ...emailChange, isEditing: true, newEmail: profile.email })}
                                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 bg-[#0f1425] p-4 rounded-lg border border-gray-700">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">New Email</label>
                                                <input
                                                    type="email"
                                                    value={emailChange.newEmail}
                                                    onChange={(e) => setEmailChange({ ...emailChange, newEmail: e.target.value })}
                                                    className="w-full bg-[#1a1f3a] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Confirm with Password</label>
                                                <input
                                                    type="password"
                                                    value={emailChange.password}
                                                    onChange={(e) => setEmailChange({ ...emailChange, password: e.target.value })}
                                                    className="w-full bg-[#1a1f3a] border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                                                    placeholder="Enter current password"
                                                    required
                                                />
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => setEmailChange({ ...emailChange, isEditing: false, password: '' })}
                                                    className="text-gray-400 hover:text-white px-3 py-1"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleEmailChange}
                                                    disabled={loading || !emailChange.newEmail || !emailChange.password}
                                                    className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-1 rounded-lg transition-colors"
                                                >
                                                    Update Email
                                                </button>
                                            </div>
                                        </div>
                                    )}
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

                                <div className="pt-8 border-t border-gray-700 mt-8">
                                    <h3 className="text-xl font-bold text-red-500 mb-4">Danger Zone</h3>
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                                        <h4 className="font-semibold text-white mb-2">Delete Account</h4>
                                        <p className="text-gray-400 text-sm mb-4">
                                            Once you delete your account, there is no going back. Please be certain.
                                        </p>
                                        {!deleteAccount.isOpen ? (
                                            <button
                                                type="button"
                                                onClick={() => setDeleteAccount({ ...deleteAccount, isOpen: true })}
                                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                                            >
                                                Delete Account
                                            </button>
                                        ) : (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                                        Type "DELETE" to confirm
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={deleteAccount.confirmText}
                                                        onChange={(e) => setDeleteAccount({ ...deleteAccount, confirmText: e.target.value })}
                                                        className="w-full bg-[#0f1425] border border-red-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                                        Confirm with Password
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={deleteAccount.password}
                                                        onChange={(e) => setDeleteAccount({ ...deleteAccount, password: e.target.value })}
                                                        className="w-full bg-[#0f1425] border border-red-500/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                                                    />
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteAccount({ isOpen: false, password: '', confirmText: '' })}
                                                        className="text-gray-400 hover:text-white px-4 py-2"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleDeleteAccount}
                                                        disabled={loading || deleteAccount.confirmText !== 'DELETE' || !deleteAccount.password}
                                                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                                                    >
                                                        Permanently Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="max-w-xl space-y-6">
                                <div className="flex items-center justify-between p-4 bg-[#0f1425] rounded-lg border border-gray-700">
                                    <div>
                                        <h3 className="font-semibold text-white">Email Notifications</h3>
                                        <p className="text-sm text-gray-400">Receive updates about your account via email</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notifications.emailNotifications}
                                            onChange={(e) => handleNotificationUpdate({ ...notifications, emailNotifications: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-[#0f1425] rounded-lg border border-gray-700">
                                    <div>
                                        <h3 className="font-semibold text-white">Push Notifications</h3>
                                        <p className="text-sm text-gray-400">Receive push notifications in browser</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notifications.pushNotifications}
                                            onChange={(e) => handleNotificationUpdate({ ...notifications, pushNotifications: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-[#0f1425] rounded-lg border border-gray-700">
                                    <div>
                                        <h3 className="font-semibold text-white">Marketing Emails</h3>
                                        <p className="text-sm text-gray-400">Receive news, updates, and special offers</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notifications.marketingEmails}
                                            onChange={(e) => handleNotificationUpdate({ ...notifications, marketingEmails: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
