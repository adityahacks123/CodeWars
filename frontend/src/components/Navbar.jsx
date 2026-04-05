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

    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const isActive = (path) => {
        return location.pathname === path ? 'text-primary font-semibold' : 'text-gray-300 hover:text-white';
    };

    return (
        <nav className="border-b border-gray-800 bg-background/80 backdrop-blur-sm relative z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <div className="bg-primary rounded-lg p-2 flex items-center justify-center">
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
                        <span className="text-white text-xl font-bold font-display">CodeArena</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/active-battles" className={`${isActive('/active-battles')} transition-colors`}>
                            Active Battles 🔥
                        </Link>
                        <Link to="/problems" className={`${isActive('/problems')} transition-colors`}>
                            Problems 📋
                        </Link>
                        <Link to="/leaderboard" className={`${isActive('/leaderboard')} transition-colors`}>
                            Leaderboard 🏆
                        </Link>
                        <Link to="/about" className={`${isActive('/about')} transition-colors`}>
                            About Us 📘
                        </Link>
                    </div>

                    {/* Desktop Right Side Buttons */}
                    <div className="hidden md:flex items-center gap-3">
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

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-300 hover:text-white p-2 focus:outline-none"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-[#0a0e27] border-t border-gray-800 absolute w-full left-0 top-16 shadow-xl">
                    <div className="px-4 pt-2 pb-4 space-y-2">
                        <Link
                            to="/active-battles"
                            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/active-battles')}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Active Battles 🔥
                        </Link>
                        <Link
                            to="/problems"
                            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/problems')}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Problems 📋
                        </Link>
                        <Link
                            to="/leaderboard"
                            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/leaderboard')}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Leaderboard 🏆
                        </Link>
                        <Link
                            to="/about"
                            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/about')}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            About Us 📘
                        </Link>
                        <div className="border-t border-gray-700 my-2 pt-2 flex gap-4 justify-center">
                            <Link
                                to="/profile"
                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors flex-1 text-center"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Profile
                            </Link>
                            <Link
                                to="/settings"
                                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors flex-1 text-center"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Settings
                            </Link>
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors flex-1 text-center"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
