import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

import Navbar from './Navbar';

const ProblemsPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
    fetchTopics();
    fetchQuestions();
  }, [navigate]);

  useEffect(() => {
    fetchQuestions();
  }, [selectedTopic, selectedDifficulty, searchTerm]);

  const fetchTopics = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PROBLEMS);
      const data = await response.json();
      if (data.success && data.data) {
        // Extract unique topics from problems
        const uniqueTopics = [...new Set(data.data.map(p => p.topic))];
        setTopics(['All', ...uniqueTopics]);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let url = API_ENDPOINTS.PROBLEMS;

      // Fetch all problems first
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();

      if (data.success && data.data) {
        let filteredProblems = data.data;

        // Filter by topic
        if (selectedTopic !== 'All') {
          filteredProblems = filteredProblems.filter(p => p.topic === selectedTopic);
        }

        // Filter by difficulty
        if (selectedDifficulty !== 'All') {
          filteredProblems = filteredProblems.filter(p => p.difficulty === selectedDifficulty);
        }

        // Filter by search term
        if (searchTerm) {
          const lowerSearchTerm = searchTerm.toLowerCase();
          filteredProblems = filteredProblems.filter(p =>
            p.title.toLowerCase().includes(lowerSearchTerm) ||
            p.statement.toLowerCase().includes(lowerSearchTerm)
          );
        }

        setQuestions(filteredProblems);
      } else {
        console.error('API returned success: false', data);
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-400 bg-green-500/10';
      case 'Medium':
        return 'text-yellow-400 bg-yellow-500/10';
      case 'Hard':
        return 'text-red-400 bg-red-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] via-[#1a2040] to-[#2a3f5f] text-white">
      {/* Background gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-purple-500/10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-cyan-500/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-radial from-purple-500/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      <Navbar />



      {/* Navigation Bar */}


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 relative z-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Practice Problems</h1>
          <p className="text-gray-400">Sharpen your coding skills with our curated problem set</p>
        </div>

        {/* Filters Section */}
        <div className="bg-[#0f1425] border border-gray-700 rounded-xl p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search problems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1a1f3a] border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Topic Filter */}
            <div className="relative z-20">
              <label className="block text-sm font-semibold text-gray-300 mb-2">Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-[#1a1f3a] border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 cursor-pointer appearance-none"
              >
                {topics.map((topic) => (
                  <option key={topic} value={topic} className="bg-[#1a1f3a] text-white">
                    {topic}
                  </option>
                ))}
              </select>
              <svg className="absolute right-3 top-10 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* Difficulty Filter */}
            <div className="relative z-20">
              <label className="block text-sm font-semibold text-gray-300 mb-2">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full bg-[#1a1f3a] border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 cursor-pointer appearance-none"
              >
                <option value="All" className="bg-[#1a1f3a] text-white">All</option>
                <option value="Easy" className="bg-[#1a1f3a] text-white">Easy</option>
                <option value="Medium" className="bg-[#1a1f3a] text-white">Medium</option>
                <option value="Hard" className="bg-[#1a1f3a] text-white">Hard</option>
              </select>
              <svg className="absolute right-3 top-10 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-[#0f1425] border border-gray-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Loading questions...</div>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">No questions found</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {questions.map((question) => (
                <div
                  key={question._id || question.problemId}
                  className="px-8 py-6 hover:bg-[#1a1f3a] transition-colors cursor-pointer border-l-4 border-transparent hover:border-cyan-500"
                  onClick={() => navigate(`/coding/${question._id || question.problemId}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-500 text-sm font-mono">#{question.problemId}</span>
                        <h3 className="text-xl font-semibold text-white">
                          {question.title}
                        </h3>
                      </div>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {question.statement}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300">
                          {question.topic}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300">
                          {question.testCases?.length || 0} test cases
                        </span>
                      </div>
                    </div>
                    <div className="ml-6 text-right">
                      <div className="text-gray-400 text-sm">
                        <div className="mb-1 text-xs">DSA Problem</div>
                        <div className="text-cyan-400 font-semibold">Solve Now →</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemsPage;
