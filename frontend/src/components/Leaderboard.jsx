import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { getCached, setCache } from '../utils/apiCache';

import Navbar from './Navbar';
import Skeleton from './common/Skeleton';

const Leaderboard = () => {
    const navigate = useNavigate();
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'weekly'

    useEffect(() => {
        fetchLeaderboard();
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);

            // Check cache first (2 minute TTL for leaderboard)
            const cacheKey = 'leaderboard_global';
            const cachedData = getCached(cacheKey, 120000);

            if (cachedData) {
                console.log('Using cached leaderboard data');
                setLeaderboardData(cachedData);
                setLoading(false);
                return;
            }

            const response = await fetch(API_ENDPOINTS.LEADERBOARD);
            const data = await response.json();

            if (data.success) {
                setLeaderboardData(data.data);
                // Cache the leaderboard data
                setCache(cacheKey, data.data);
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankStyle = (rank) => {
        switch (rank) {
            case 1: return 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)] scale-110 z-10';
            case 2: return 'border-gray-300 shadow-[0_0_15px_rgba(209,213,219,0.2)] mt-8';
            case 3: return 'border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.2)] mt-12';
            default: return 'border-gray-700';
        }
    };

    const getMedalIcon = (rank) => {
        switch (rank) {
            case 1: return '👑';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] via-[#1a2040] to-[#2a3f5f] text-white relative overflow-hidden">
            {/* Background gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-purple-500/10 pointer-events-none"></div>

            <Navbar />

            <div className="max-w-6xl mx-auto px-8 py-12 relative z-10">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">Global <span className="text-cyan-400">Leaderboard</span></h1>
                    <p className="text-gray-400">Top developers competing for glory</p>
                </div>

                {loading ? (
                    <div className="animate-pulse">
                        {/* Podium Skeleton */}
                        <div className="flex justify-center items-end gap-6 mb-16 h-64">
                            <div className="flex flex-col items-center">
                                <Skeleton className="w-24 h-24 rounded-full mb-3" />
                                <Skeleton className="w-20 h-4 mb-2" />
                                <Skeleton className="w-16 h-4" />
                            </div>
                            <div className="flex flex-col items-center">
                                <Skeleton className="w-32 h-32 rounded-full mb-4" />
                                <Skeleton className="w-24 h-6 mb-2" />
                                <Skeleton className="w-20 h-4" />
                            </div>
                            <div className="flex flex-col items-center">
                                <Skeleton className="w-24 h-24 rounded-full mb-3" />
                                <Skeleton className="w-20 h-4 mb-2" />
                                <Skeleton className="w-16 h-4" />
                            </div>
                        </div>

                        {/* List Skeleton */}
                        <div className="bg-[#1a1f3a]/60 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
                            <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-700">
                                <Skeleton className="col-span-1 h-4" />
                                <Skeleton className="col-span-4 h-4" />
                                <Skeleton className="col-span-2 h-4" />
                                <Skeleton className="col-span-2 h-4" />
                                <Skeleton className="col-span-2 h-4" />
                                <Skeleton className="col-span-1 h-4" />
                            </div>
                            <div className="divide-y divide-gray-700/50">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center">
                                        <Skeleton className="col-span-1 h-4" />
                                        <div className="col-span-4 flex items-center gap-3">
                                            <Skeleton className="w-8 h-8 rounded-full" />
                                            <div className="flex-1">
                                                <Skeleton className="w-24 h-4 mb-1" />
                                                <Skeleton className="w-16 h-3" />
                                            </div>
                                        </div>
                                        <Skeleton className="col-span-2 h-4" />
                                        <Skeleton className="col-span-2 h-4" />
                                        <Skeleton className="col-span-2 h-6 rounded" />
                                        <Skeleton className="col-span-1 h-6 w-6 rounded-full mx-auto" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Podium Section */}
                        <div className="flex justify-center items-end gap-6 mb-16 h-64">
                            {/* 2nd Place */}
                            {leaderboardData[1] && (
                                <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                    <div className={`relative w-24 h-24 rounded-full border-4 ${getRankStyle(2)} overflow-hidden bg-gray-800`}>
                                        {leaderboardData[1].avatar ? (
                                            <img src={leaderboardData[1].avatar} alt={leaderboardData[1].name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
                                                {leaderboardData[1].name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-gray-300 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                                            2nd
                                        </div>
                                    </div>
                                    <div className="mt-3 text-center">
                                        <div className="font-bold text-white">{leaderboardData[1].name}</div>
                                        <div className="text-cyan-400 font-mono font-bold">{leaderboardData[1].score} pts</div>
                                    </div>
                                </div>
                            )}

                            {/* 1st Place */}
                            {leaderboardData[0] && (
                                <div className="flex flex-col items-center animate-fade-in-up">
                                    <div className="absolute -top-10 text-4xl animate-bounce">👑</div>
                                    <div className={`relative w-32 h-32 rounded-full border-4 ${getRankStyle(1)} overflow-hidden bg-gray-800`}>
                                        {leaderboardData[0].avatar ? (
                                            <img src={leaderboardData[0].avatar} alt={leaderboardData[0].name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-yellow-500">
                                                {leaderboardData[0].name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                                            1st
                                        </div>
                                    </div>
                                    <div className="mt-4 text-center">
                                        <div className="text-xl font-bold text-white">{leaderboardData[0].name}</div>
                                        <div className="text-cyan-400 font-mono text-lg font-bold">{leaderboardData[0].score} pts</div>
                                        <div className="text-xs text-gray-400 mt-1">{leaderboardData[0].totalSolved} Solved</div>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {leaderboardData[2] && (
                                <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                                    <div className={`relative w-24 h-24 rounded-full border-4 ${getRankStyle(3)} overflow-hidden bg-gray-800`}>
                                        {leaderboardData[2].avatar ? (
                                            <img src={leaderboardData[2].avatar} alt={leaderboardData[2].name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
                                                {leaderboardData[2].name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-orange-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                                            3rd
                                        </div>
                                    </div>
                                    <div className="mt-3 text-center">
                                        <div className="font-bold text-white">{leaderboardData[2].name}</div>
                                        <div className="text-cyan-400 font-mono font-bold">{leaderboardData[2].score} pts</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Leaderboard List */}
                        <div className="bg-[#1a1f3a]/60 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden overflow-x-auto">
                            <div className="min-w-[600px] grid grid-cols-12 gap-4 p-4 border-b border-gray-700 text-gray-400 font-semibold text-sm">
                                <div className="col-span-1 text-center">Rank</div>
                                <div className="col-span-4">User</div>
                                <div className="col-span-2 text-center">Score</div>
                                <div className="col-span-2 text-center">Solved</div>
                                <div className="col-span-2 text-center">Language</div>
                                <div className="col-span-1 text-center">Action</div>
                            </div>

                            <div className="divide-y divide-gray-700/50 min-w-[600px]">
                                {leaderboardData.slice(3).map((user) => (
                                    <div
                                        key={user._id}
                                        className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#1a1f3a] transition-colors ${currentUser && (currentUser._id === user._id || currentUser.id === user._id)
                                            ? 'bg-cyan-500/10 border-l-4 border-cyan-500'
                                            : ''
                                            }`}
                                    >
                                        <div className="col-span-1 text-center font-bold text-gray-300">#{user.rank}</div>
                                        <div className="col-span-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white">{user.name}</div>
                                                <div className="text-xs text-gray-500">@{user.username}</div>
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-center font-mono font-bold text-cyan-400">{user.score}</div>
                                        <div className="col-span-2 text-center text-gray-300">
                                            {user.totalSolved} <span className="text-xs text-gray-500">({user.hardSolved}H)</span>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                                                {user.mainLanguage}
                                            </span>
                                        </div>
                                        <div className="col-span-1 text-center">
                                            <button className="text-gray-400 hover:text-white transition-colors" title="Challenge">
                                                ⚔️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
