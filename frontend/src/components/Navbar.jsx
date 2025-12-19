import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

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

    const isActive = (path) => {
        return location.pathname === path ? 'text-cyan-400 font-semibold' : 'text-gray-300 hover:text-white';
    };

    return (
        <nav className="border-b border-gray-800 bg-[#0a0e27]/80 backdrop-blur-sm relative z-10">
            <div className="max-w-7xl mx-auto px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center gap-2">
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
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-8">
                        <Link
                            to="/active-battles"
                            className={`${isActive('/active-battles')} transition-colors`}
                        >
                            Active Battles 🔥
                        </Link>
                        <Link
                            to="/problems"
                            className={`${isActive('/problems')} transition-colors`}
                        >
                            Problems 📋
                        </Link>
                        <Link
                            to="/leaderboard"
                            className={`${isActive('/leaderboard')} transition-colors`}
                        >
                            Leaderboard 🏆
                        </Link>
                        <Link
                            to="/about"
                            className={`${isActive('/about')} transition-colors`}
                        >
                            About Us 📘
                        </Link>
                    </div>

                    {/* Right Side Buttons */}
                    <div className="flex items-center gap-3">
                        <Link
                            to="/profile"
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                            title="Profile"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </Link>
                        <Link
                            to="/settings"
                            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                            title="Settings"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
