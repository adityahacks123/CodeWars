import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from './Navbar';

const AboutUs = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] via-[#1a2040] to-[#2a3f5f] text-white relative overflow-hidden">
            {/* Background gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-purple-500/10 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-cyan-500/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-radial from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            {/* Navigation Bar */}
            <Navbar />

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-8 py-16 relative z-10">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold mb-6">
                        About <span className="text-cyan-400">CodeArena</span>
                    </h1>
                    <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
                        The ultimate real-time coding battle platform where developers compete, collaborate, and improve their skills together.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <div className="bg-[#1a1f3a]/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 hover:border-cyan-500/50 transition-all duration-300">
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-6">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-white">Real-time Battles</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Challenge friends or random opponents to live coding duels. Write code, pass test cases, and see who solves the problem first in real-time.
                        </p>
                    </div>

                    <div className="bg-[#1a1f3a]/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 hover:border-purple-500/50 transition-all duration-300">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6">
                            <span className="text-2xl">👁️</span>
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-white">Spectator Mode</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Watch ongoing battles live! Learn from top developers by observing their problem-solving techniques and coding style in real-time.
                        </p>
                    </div>

                    <div className="bg-[#1a1f3a]/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 hover:border-green-500/50 transition-all duration-300">
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-6">
                            <span className="text-2xl">📋</span>
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-white">Diverse Problems</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Access a vast library of coding problems ranging from Easy to Hard. Practice data structures, algorithms, and optimize your solutions.
                        </p>
                    </div>

                    <div className="bg-[#1a1f3a]/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 hover:border-yellow-500/50 transition-all duration-300">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-6">
                            <span className="text-2xl">🏆</span>
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-white">Global Leaderboard</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Climb the ranks! Earn points for every victory and successful submission. Compete with developers worldwide for the top spot.
                        </p>
                    </div>
                </div>

                {/* How it Works Section */}
                <div className="bg-[#1a1f3a]/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-10 mb-16">
                    <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
                    <div className="space-y-8">
                        <div className="flex gap-6 items-start">
                            <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-lg flex-shrink-0">1</div>
                            <div>
                                <h4 className="text-lg font-bold mb-2 text-white">Create or Join a Room</h4>
                                <p className="text-gray-400">Start a new battle room and invite friends using a unique code, or browse active battles to join or spectate.</p>
                            </div>
                        </div>
                        <div className="flex gap-6 items-start">
                            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center font-bold text-lg flex-shrink-0">2</div>
                            <div>
                                <h4 className="text-lg font-bold mb-2 text-white">Solve the Problem</h4>
                                <p className="text-gray-400">Once the battle starts, you'll be given a coding problem. Write your solution in the integrated code editor with syntax highlighting.</p>
                            </div>
                        </div>
                        <div className="flex gap-6 items-start">
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold text-lg flex-shrink-0">3</div>
                            <div>
                                <h4 className="text-lg font-bold mb-2 text-white">Run & Submit</h4>
                                <p className="text-gray-400">Test your code against sample cases. When you're confident, submit your solution. The first to pass all test cases wins!</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-6">Ready to Code?</h2>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/25"
                    >
                        Start Competing Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
