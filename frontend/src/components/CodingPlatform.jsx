import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import CodeEditor from './CodeEditor';
import { generateBoilerplate, getDriverCode, transformInput } from '../utils/ProblemHelpers';
import { getCached, setCache, invalidateCache } from '../utils/apiCache';
import Skeleton from './common/Skeleton';
import toast from 'react-hot-toast';

const CodingPlatform = () => {
  const navigate = useNavigate();
  const { questionId } = useParams();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get('roomCode');
  const isSpectator = searchParams.get('mode') === 'spectator';
  const socket = useSocket();
  const [question, setQuestion] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [room, setRoom] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [isSolved, setIsSolved] = useState(false);
  const [participantsProgress, setParticipantsProgress] = useState({});
  const [user, setUser] = useState(null);

  // Multi-language support
  const [language, setLanguage] = useState('cpp');

  useEffect(() => {
    fetchUser();
    fetchQuestion();
    if (roomCode) {
      fetchRoomDetails();
    }
  }, [questionId, roomCode]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ME, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  // Update boilerplate when language changes
  useEffect(() => {
    if (question) {
      console.log('Language changed to:', language);
      const newCode = generateBoilerplate(language, question);
      console.log('Setting new code, first 50 chars:', newCode.substring(0, 50));
      setCode(newCode);
    }
  }, [language, question]);

  // Socket listeners for battle
  useEffect(() => {
    if (!socket || !roomCode || !user) return;

    socket.emit('join_room', { roomCode, userId: user._id });

    socket.on('opponent_progress', ({ user: opponent, status, passedTests, totalTests }) => {
      setParticipantsProgress(prev => ({
        ...prev,
        [opponent._id]: {
          name: opponent.name,
          status,
          passedTests,
          totalTests,
          percentage: Math.round((passedTests / totalTests) * 100)
        }
      }));

      if (status === 'SUCCESS') {
        toast.success(`${opponent.name} solved the problem! 🏆`);
      }

      // Refresh submissions list to see the new submission
      fetchSubmissions();
    });

    socket.on('game_over', ({ winner }) => {
      toast.success(`🏆 Game Over! ${winner.name} won the battle!`, { duration: 5000 });
      setIsSolved(true);
      // Disable editor or show modal here if needed
      // alert(`Game Over! ${winner.name} won the battle! \nReturning to dashboard in 5 seconds...`);
      setTimeout(() => navigate('/dashboard'), 5000);
    });

    return () => {
      socket.off('opponent_progress');
      socket.off('game_over');
    };
  }, [socket, roomCode, user]);

  // Keyboard shortcuts: Ctrl+Enter to Run, Ctrl+S to Submit
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter or Cmd+Enter to run code
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!running && question && !isSpectator) {
          runCode();
        }
      }

      // Ctrl+S or Cmd+S to submit code
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!running && question && !isSpectator) {
          submitCode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [running, question, isSpectator, code]);

  const fetchQuestion = async () => {
    try {
      console.log('Fetching problem with ID:', questionId);

      // Check cache first (5 minute TTL)
      const cacheKey = `problem_${questionId}`;
      const cachedData = getCached(cacheKey, 300000);

      if (cachedData) {
        console.log('Using cached problem data');
        setQuestion(cachedData);
        setCode(generateBoilerplate('cpp', cachedData));
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.PROBLEMS}/${questionId}`);
      const data = await response.json();
      console.log('API Response:', data);
      if (data.success) {
        setQuestion(data.data);
        setCode(generateBoilerplate('cpp', data.data));
        // Cache the problem data
        setCache(cacheKey, data.data);
      } else {
        console.error('Problem not found:', data.message);
      }
    } catch (error) {
      console.error('Error fetching question:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ROOMS}/${roomCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRoom(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
    }
  };

  const runCode = async () => {
    setRunning(true);
    setOutput('Running code...');
    try {
      const result = await executeCode(code, question.testCases);
      setOutput(result);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setRunning(false);
    }
  };

  const executeCode = async (userCode, testCases, retryCount = 0) => {
    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 30000; // 30 seconds

    try {
      const token = localStorage.getItem('token');

      const inputs = testCases.map(tc => {
        const rawInput = typeof tc === 'string' ? tc : tc.input;
        return transformInput(rawInput, null);
      });

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      let response;
      try {
        response = await fetch(API_ENDPOINTS.EXECUTE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            language,
            code: getDriverCode(language, userCode, question),
            inputs
          }),
          signal: controller.signal
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);

        // Handle timeout
        if (fetchError.name === 'AbortError') {
          if (retryCount < MAX_RETRIES) {
            console.log(`Execution timeout, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
            return executeCode(userCode, testCases, retryCount + 1);
          }
          throw new Error('⏱️ Code execution timed out after 30 seconds. Your code might have an infinite loop or be too slow.');
        }

        // Handle network errors
        if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
          if (retryCount < MAX_RETRIES) {
            console.log(`Network error, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return executeCode(userCode, testCases, retryCount + 1);
          }
          throw new Error('🌐 Network error: Could not connect to code execution service. Please check your internet connection.');
        }

        throw fetchError;
      }

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 503 || response.status === 502) {
          if (retryCount < MAX_RETRIES) {
            console.log(`Server unavailable, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s for server errors
            return executeCode(userCode, testCases, retryCount + 1);
          }
          throw new Error('🔧 Code execution service is temporarily unavailable. Please try again in a moment.');
        }
        throw new Error(`Server error (${response.status}): ${errorText || 'Unknown error'}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Execution failed');
      }

      // Format results
      let formattedOutput = '';
      let passedCount = 0;

      data.data.forEach((res, index) => {
        const expectedOutput = typeof testCases[index] === 'string' ? '' : testCases[index].output;
        const actualOutput = res.output;
        const isCorrect = !expectedOutput || actualOutput.trim() === expectedOutput.trim();

        if (isCorrect && !res.error) passedCount++;

        formattedOutput += `Test Case ${index + 1}: ${res.error ? 'ERROR' : (isCorrect ? 'PASSED' : 'FAILED')}\n`;
        if (res.error) {
          formattedOutput += `Error: ${res.error}\n`;
        } else {
          formattedOutput += `Input: ${res.input}\n`;
          formattedOutput += `Output: ${actualOutput}\n`;
          if (expectedOutput) formattedOutput += `Expected: ${expectedOutput}\n`;
        }
        formattedOutput += '\n-------------------\n\n';
      });

      return formattedOutput;
    } catch (error) {
      console.error('Code execution error:', error);
      return `Execution Error: ${error.message}`;
    }
  };

  const submitCode = async () => {
    if (!code || code.trim() === '') {
      alert('Please write some code before submitting!');
      return;
    }

    if (running) return;

    try {
      setRunning(true);
      const loadingToast = toast.loading('Submitting solution...');

      // Send submission to backend for verification
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.SUBMISSIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          problemId: questionId,
          code: code,
          language: language
        })
      });

      const data = await response.json();

      if (response.ok) {
        const submission = data.data;
        const isSuccess = submission.status === 'SUCCESS';

        if (isSuccess) {
          toast.success('🎉 Solution Submitted & Accepted!', { id: loadingToast });
          setIsSolved(true);

          // If in a room, notify server
          if (roomCode && socket && user) {
            socket.emit('submission_result', {
              roomCode,
              user,
              passedTests: submission.passedTests,
              totalTests: submission.totalTests,
              status: 'SUCCESS'
            });
          }
        } else {
          toast.error(`❌ Solution Failed (${submission.passedTests}/${submission.totalTests} tests passed)`, { id: loadingToast });
          // If in a room, notify server of progress
          if (roomCode && socket && user) {
            socket.emit('submission_result', {
              roomCode,
              user,
              passedTests: submission.passedTests,
              totalTests: submission.totalTests,
              status: 'FAILED'
            });
          }
        }
        // Refresh submissions list
        fetchSubmissions();
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(`Submission failed: ${error.message}`);
    } finally {
      setRunning(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.SUBMISSIONS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Handle 401 gracefully - user might not be logged in
      if (response.status === 401) {
        console.log('Not authorized to fetch submissions');
        setSubmissions([]);
        return;
      }

      if (response.ok) {
        const data = await response.json();

        // Filter submissions for current problem
        // Filter submissions for current problem
        const problemSubmissions = data.data.filter(sub => {
          // Handle populated problemId (object) or unpopulated (string)
          const subProblemId = sub.problemId && sub.problemId._id
            ? String(sub.problemId._id)
            : String(sub.problemId);

          return subProblemId === String(questionId);
        });

        setSubmissions(problemSubmissions);

        // Check if problem is solved
        const hasSuccessfulSubmission = problemSubmissions.some(sub => sub.status === 'SUCCESS');
        setIsSolved(hasSuccessfulSubmission);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Fetch submissions when tab changes to submissions AND on initial load
  useEffect(() => {
    fetchSubmissions(); // Always fetch on component load
  }, [questionId]);

  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchSubmissions(); // Also refresh when clicking submissions tab
    }
  }, [activeTab, questionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2040] text-white flex flex-col h-screen overflow-hidden">
        {/* Header Skeleton */}
        <div className="h-16 border-b border-gray-800 bg-[#0a0e27]/80 flex items-center px-8">
          <Skeleton className="w-8 h-8 rounded mr-4" />
          <Skeleton className="w-48 h-6 rounded mr-4" />
          <Skeleton className="w-20 h-6 rounded-full" />
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel Skeleton */}
          <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col border-r border-gray-800 bg-[#0a0e27]/50 p-6 space-y-6">
            <Skeleton className="w-32 h-8 rounded mb-4" />
            <div className="space-y-2">
              <Skeleton className="w-full h-4 rounded" />
              <Skeleton className="w-full h-4 rounded" />
              <Skeleton className="w-3/4 h-4 rounded" />
            </div>
            <div className="space-y-2 mt-8">
              <Skeleton className="w-24 h-6 rounded mb-2" />
              <Skeleton className="w-full h-24 rounded" />
            </div>
          </div>

          {/* Right Panel Skeleton */}
          <div className="w-full md:w-1/2 h-1/2 md:h-full bg-[#1e1e1e] flex flex-col">
            <div className="h-10 border-b border-[#333] bg-[#252526] flex items-center px-4 gap-2">
              <Skeleton className="w-20 h-6 rounded" />
              <Skeleton className="w-20 h-6 rounded" />
            </div>
            <div className="flex-1 p-4">
              <Skeleton className="w-full h-full rounded opacity-10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2040] text-white flex items-center justify-center">
        <div className="text-2xl">Question not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2040] text-white flex flex-col h-screen md:overflow-hidden overflow-auto">
      {/* Header */}
      <nav className="border-b border-gray-800 bg-[#0a0e27]/80 backdrop-blur-sm sticky top-0 z-20 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <h1 className="text-sm md:text-xl font-bold truncate">{question.title}</h1>
                {isSolved && (
                  <span className="hidden md:flex bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold items-center gap-1">
                    ✅ Solved
                  </span>
                )}
              </div>
              <span className={`hidden md:block px-3 py-1 rounded-full text-xs font-semibold ${question.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                question.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                {question.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-2 md:gap-4 ml-2">
              {isSpectator ? (
                <div className="bg-purple-500/20 text-purple-300 border border-purple-500/50 px-3 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-semibold animate-pulse flex items-center gap-2">
                  <span>👁️</span> <span className="hidden md:inline">Spectating Mode</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={runCode}
                    disabled={running || isSolved}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 md:px-6 md:py-2 rounded-lg transition-colors font-semibold flex items-center gap-2 text-xs md:text-sm"
                    title="Keyboard shortcut: Ctrl+Enter (Cmd+Enter on Mac)"
                  >
                    {running ? '...' : (
                      <>
                        <span className="md:hidden">Run</span>
                        <span className="hidden md:inline">Run Code</span>
                        <span className="hidden lg:inline text-xs opacity-60">(Ctrl+↵)</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={submitCode}
                    disabled={running || isSolved}
                    className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 md:px-6 md:py-2 rounded-lg transition-colors font-semibold flex items-center gap-2 text-xs md:text-sm"
                    title="Keyboard shortcut: Ctrl+S (Cmd+S on Mac)"
                  >
                    Submit
                    <span className="hidden lg:inline text-xs opacity-60">(Ctrl+S)</span>
                  </button>
                </>
              )}
              {room && (
                <div className="relative">
                  <button
                    onClick={() => setShowParticipants(!showParticipants)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors font-semibold flex items-center gap-2 text-xs md:text-sm"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
                    </svg>
                    {room.participants.length}
                  </button>
                  {showParticipants && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#1a1f3a] border border-gray-700 rounded-lg shadow-xl z-50">
                      <div className="p-4">
                        <h3 className="font-bold mb-3">Participants</h3>
                        <div className="space-y-3">
                          {room.participants.map(p => (
                            <div key={p.user._id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                                  {p.user.avatar ? (
                                    <img src={p.user.avatar} alt={p.user.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs">{p.user.name[0]}</span>
                                  )}
                                </div>
                                <span className="text-sm">{p.user.name}</span>
                              </div>
                              {participantsProgress[p.user._id] && (
                                <div className="text-xs text-right">
                                  <div className={`font-bold ${participantsProgress[p.user._id].status === 'SUCCESS' ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {participantsProgress[p.user._id].percentage}%
                                  </div>
                                  <div className="text-gray-400">
                                    {participantsProgress[p.user._id].passedTests}/{participantsProgress[p.user._id].totalTests}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>



      {/* Main Content - Fixed Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel: Problem Description */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col border-r border-gray-800 bg-[#0a0e27]/50">
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab('description')}
              className={`flex-1 px-6 py-3 font-semibold transition-colors ${activeTab === 'description'
                ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-500'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('testcases')}
              className={`flex-1 px-6 py-3 font-semibold transition-colors ${activeTab === 'testcases'
                ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-500'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Test Cases
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex-1 px-6 py-3 font-semibold transition-colors ${activeTab === 'submissions'
                ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-500'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Submissions
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'description' && (
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-3">Description</h2>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{question.statement || question.description}</p>
                </div>

                {/* Examples */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-3">Examples</h2>
                  <div className="space-y-4">
                    {question.examples.map((example, index) => (
                      <div key={index} className="bg-[#0f1425] border border-gray-700 rounded-lg p-4">
                        <div className="mb-3">
                          <p className="text-gray-400 text-sm font-semibold mb-1">Input:</p>
                          <p className="text-cyan-300 font-mono text-sm">{example.input}</p>
                        </div>
                        <div className="mb-3">
                          <p className="text-gray-400 text-sm font-semibold mb-1">Output:</p>
                          <p className="text-green-300 font-mono text-sm">{example.output}</p>
                        </div>
                        {example.explanation && (
                          <div>
                            <p className="text-gray-400 text-sm font-semibold mb-1">Explanation:</p>
                            <p className="text-gray-300 text-sm">{example.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Constraints */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-3">Constraints</h2>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{question.constraints}</p>
                </div>

                {/* Topics */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-3">Topics</h2>
                  <div className="flex flex-wrap gap-2">
                    {(question.topics || [question.topic]).map((topic) => (
                      <span
                        key={topic}
                        className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-500/20 text-purple-300"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'testcases' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white mb-4">Test Cases</h2>
                {question.testCases && question.testCases.map((testCase, index) => {
                  // Handle both string and object test cases
                  const isStringTestCase = typeof testCase === 'string';
                  const testCaseObj = isStringTestCase ? { input: testCase, output: '' } : testCase;
                  return (
                    <div key={index} className="bg-[#0f1425] border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-cyan-400">Test Case {index + 1}</h3>
                        <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                          {index === 0 ? 'Example' : 'Test'}
                        </span>
                      </div>
                      <div className="mb-3">
                        <p className="text-gray-400 text-sm font-semibold mb-1">Input:</p>
                        <p className="text-cyan-300 font-mono text-sm bg-[#0a0e27] p-2 rounded whitespace-pre-wrap break-words">
                          {testCaseObj.input}
                        </p>
                      </div>
                      {testCaseObj.output && (
                        <div>
                          <p className="text-gray-400 text-sm font-semibold mb-1">Output:</p>
                          <p className="text-green-300 font-mono text-sm bg-[#0a0e27] p-2 rounded whitespace-pre-wrap break-words">
                            {testCaseObj.output}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-white">Your Submissions</h2>
                  <button
                    onClick={fetchSubmissions}
                    className="text-cyan-400 hover:text-cyan-300 text-sm"
                  >
                    Refresh
                  </button>
                </div>

                {loadingSubmissions ? (
                  <div className="text-center py-8 text-gray-400">Loading submissions...</div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-[#0f1425] rounded-lg border border-gray-700">
                    No submissions yet. Try solving the problem!
                  </div>
                ) : (
                  submissions.map((sub, index) => (
                    <div key={sub._id || index} className="bg-[#0f1425] border border-gray-700 rounded-lg overflow-hidden">
                      <div
                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-[#1a2040] transition-colors"
                        onClick={() => setExpandedSubmission(expandedSubmission === sub._id ? null : sub._id)}
                      >
                        <div>
                          <div className={`font-bold ${sub.status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>
                            {sub.status === 'SUCCESS' ? 'Accepted' : 'Wrong Answer'}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-300">
                            Tests: {sub.passedTests}/{sub.totalTests}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Language: {sub.language || 'cpp'}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedSubmission === sub._id && (
                        <div className="border-t border-gray-700 bg-[#0a0e27] p-4">
                          <h4 className="text-sm font-bold text-gray-300 mb-3">Test Results</h4>
                          <div className="space-y-3">
                            {sub.testResults && sub.testResults.map((test, i) => (
                              <div key={i} className={`p-3 rounded border ${test.passed ? 'border-green-900/50 bg-green-900/10' : 'border-red-900/50 bg-red-900/10'}`}>
                                <div className="flex justify-between items-center mb-2">
                                  <span className={`text-xs font-bold ${test.passed ? 'text-green-400' : 'text-red-400'}`}>
                                    Test Case {i + 1}: {test.passed ? 'Passed' : 'Failed'}
                                  </span>
                                  {test.error && <span className="text-xs text-red-300 bg-red-900/20 px-2 py-1 rounded">Error</span>}
                                </div>

                                <div className="grid grid-cols-1 gap-2 text-xs font-mono">
                                  <div>
                                    <span className="text-gray-500">Input:</span>
                                    <div className="text-gray-300 bg-[#0f1425] p-1 rounded mt-1 whitespace-pre-wrap">{test.input}</div>
                                  </div>

                                  {!test.passed && (
                                    <>
                                      <div>
                                        <span className="text-gray-500">Expected:</span>
                                        <div className="text-green-300/70 bg-[#0f1425] p-1 rounded mt-1 whitespace-pre-wrap">{test.expected}</div>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Actual:</span>
                                        <div className="text-red-300/70 bg-[#0f1425] p-1 rounded mt-1 whitespace-pre-wrap">{test.output}</div>
                                      </div>
                                    </>
                                  )}

                                  {test.error && (
                                    <div>
                                      <span className="text-gray-500">Error Message:</span>
                                      <div className="text-red-400 bg-[#0f1425] p-1 rounded mt-1 whitespace-pre-wrap">{test.error}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            {(!sub.testResults || sub.testResults.length === 0) && (
                              <div className="text-gray-500 text-sm italic">No detailed test results available.</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Code Editor */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-[#1e1e1e]">
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
            <div className="flex items-center gap-4">
              <div className="flex bg-[#3c3c3c] rounded p-1 gap-1">
                {['cpp', 'java', 'python', 'javascript'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => {
                      console.log('Language button clicked:', lang);
                      setLanguage(lang);
                    }}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${language === lang
                      ? 'bg-cyan-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#4c4c4c]'
                      }`}
                  >
                    {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JS' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </button>
                ))}
              </div>

              <div className="text-gray-400 text-sm">
                Theme: 🌙 Dark
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCode(generateBoilerplate(language, question))}
                className="px-3 py-1 text-sm text-gray-300 hover:text-white hover:bg-[#3c3c3c] rounded transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="px-3 py-1 text-sm text-gray-300 hover:text-white hover:bg-[#3c3c3c] rounded transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 relative overflow-hidden">
            <CodeEditor
              key={language} // Force re-mount on language change to ensure clean state
              initialCode={code}
              onChange={setCode}
              language={language === 'cpp' ? 'cpp' : language === 'python' ? 'python' : language === 'java' ? 'java' : 'javascript'}
              theme="vs-dark"
              showToolbar={false}
            />
          </div>

          {/* Output Panel */}
          <div className="h-1/3 border-t border-[#333] bg-[#1e1e1e] flex flex-col">
            <div className="px-4 py-2 bg-[#252526] border-b border-[#333] font-semibold text-sm text-gray-300">
              Output
            </div>
            <div className="flex-1 p-4 font-mono text-sm overflow-auto whitespace-pre-wrap text-gray-300">
              {output || 'Run your code to see output here...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingPlatform;
