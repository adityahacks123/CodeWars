import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const QuestionSelectionModal = ({ isOpen, onClose, onSelectQuestion }) => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTopics();
      fetchQuestions();
    }
  }, [isOpen]);

  useEffect(() => {
    fetchQuestions();
  }, [selectedTopic, selectedDifficulty, searchTerm]);

  const fetchTopics = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PROBLEMS);
      const data = await response.json();
      if (data.success && data.data) {
        const uniqueTopics = [...new Set(data.data.map(problem => problem.topic))];
        setTopics(['All', ...uniqueTopics]);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.PROBLEMS);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        let filteredProblems = data.data;

        if (selectedTopic !== 'All') {
          filteredProblems = filteredProblems.filter(problem => problem.topic === selectedTopic);
        }

        if (selectedDifficulty !== 'All') {
          filteredProblems = filteredProblems.filter(problem => problem.difficulty === selectedDifficulty);
        }

        if (searchTerm) {
          const lowerSearchTerm = searchTerm.toLowerCase();
          filteredProblems = filteredProblems.filter(problem =>
            problem.title.toLowerCase().includes(lowerSearchTerm) ||
            problem.statement?.toLowerCase().includes(lowerSearchTerm)
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

  const handleCreateRoom = async (question) => {
    try {
      setCreatingRoom(true);
      const token = localStorage.getItem('token');
      const problemId = question._id || question.problemId;

      if (!problemId) {
        throw new Error('No problem identifier found');
      }

      const response = await fetch(API_ENDPOINTS.ROOMS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questionId: problemId })
      });

      const data = await response.json();

      if (data.success) {
        onClose();
        navigate(`/room/${data.data.roomCode}`);
      } else {
        console.error('Failed to create room:', data.message);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setCreatingRoom(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#0a0e27] border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-gray-700 px-8 py-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Select a Problem</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="border-b border-gray-700 px-8 py-4 bg-[#0f1425]">
          <div className="grid grid-cols-3 gap-4">
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
        <div className="flex-1 overflow-y-auto">
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
                  key={question._id}
                  className="px-8 py-4 hover:bg-[#1a1f3a] transition-colors cursor-pointer border-l-4 border-transparent hover:border-cyan-500"
                  onClick={() => handleCreateRoom(question)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {question.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {question.statement}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty}
                        </span>
                        {question.topic && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300">
                            {question.topic}
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300">
                          {question.testCases?.length || 0} test cases
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-gray-400 text-sm">
                        <div>Problem #{question.problemId}</div>
                        {question.acceptanceRate != null && (
                          <div className="text-cyan-400">{question.acceptanceRate}% AC</div>
                        )}
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

export default QuestionSelectionModal;
