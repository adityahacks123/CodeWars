import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import CodeEditor from './CodeEditor';

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
  const [isSolved, setIsSolved] = useState(false);
  const [notification, setNotification] = useState(null);
  const [participantsProgress, setParticipantsProgress] = useState({});

  useEffect(() => {
    fetchQuestion();
    if (roomCode) {
      fetchRoomDetails();
    }
  }, [questionId, roomCode]);

  // Socket listeners for battle
  useEffect(() => {
    if (!socket || !roomCode) return;

    socket.emit('join_room', roomCode);

    socket.on('opponent_progress', ({ user, status, passedTests, totalTests }) => {
      setParticipantsProgress(prev => ({
        ...prev,
        [user._id]: {
          name: user.name,
          status,
          passedTests,
          totalTests,
          percentage: Math.round((passedTests / totalTests) * 100)
        }
      }));

      if (status === 'SUCCESS') {
        setNotification(`${user.name} solved the problem! 🏆`);
      }

      // Refresh submissions list to see the new submission
      fetchSubmissions();

      setTimeout(() => setNotification(null), 5000);
    });

    socket.on('game_over', ({ winner }) => {
      setNotification(`🏆 Game Over! ${winner.name} won the battle!`);
      setIsSolved(true);
      // Disable editor or show modal here if needed
      alert(`Game Over! ${winner.name} won the battle! \nReturning to dashboard in 5 seconds...`);
      setTimeout(() => navigate('/dashboard'), 5000);
    });

    return () => {
      socket.off('opponent_progress');
      socket.off('game_over');
    };
  }, [socket, roomCode]);

  const fetchQuestion = async () => {
    try {
      console.log('Fetching problem with ID:', questionId);
      // Fetch from new problems API
      const response = await fetch(`http://localhost:3001/api/problems/${questionId}`);
      const data = await response.json();
      console.log('API Response:', data);
      if (data.success) {
        setQuestion(data.data);
        const cppBoilerplate = `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

// Problem: ${data.data.title}

int main() {
    // TODO: Write your solution here
    
    return 0;
}`;
        setCode(cppBoilerplate);
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
    try {
      // Simulate code execution
      const result = await executeCode(code, question.testCases);
      setOutput(result);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setRunning(false);
    }
  };

  const executeCode = (userCode, testCases) => {
    return new Promise((resolve) => {
      try {
        // Create a function from the code
        const func = new Function(userCode + '\n return ' + question.title.replace(/\s+/g, ''));

        let results = [];
        testCases.forEach((testCase, index) => {
          try {
            const result = func();
            results.push(`Test Case ${index + 1}: PASSED`);
          } catch (e) {
            results.push(`Test Case ${index + 1}: FAILED - ${e.message}`);
          }
        });

        resolve(results.join('\n'));
      } catch (error) {
        resolve(`Compilation Error: ${error.message}`);
      }
    });
  };

  const submitCode = async () => {
    if (!code || code.trim() === '') {
      alert('Please write some code before submitting!');
      return;
    }

    if (running) return;

    try {
      setRunning(true);

      // First run local tests
      const testResult = await executeCode(code, question.testCases);
      const passedTests = testResult.match(/PASSED/g)?.length || 0;
      const totalTests = question.testCases.length;
      const isSuccess = passedTests === totalTests;

      // Send to backend
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          problemId: questionId,
          code: code,
          language: 'cpp', // Defaulting to cpp as per boilerplate
          status: isSuccess ? 'SUCCESS' : 'FAILED',
          passedTests,
          totalTests,
          timeTaken: 0, // TODO: Measure execution time
          memoryTaken: 0
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (isSuccess) {
          setNotification('🎉 Solution Submitted & Accepted!');
          setIsSolved(true);

          // If in a room, notify server
          if (roomCode && socket) {
            socket.emit('submit_code', {
              roomCode,
              passedTests,
              totalTests,
              status: 'SUCCESS'
            });
          }
        } else {
          setNotification(`❌ Solution Submitted but Failed (${passedTests}/${totalTests} tests passed)`);
          // If in a room, notify server of progress
          if (roomCode && socket) {
            socket.emit('submit_code', {
              roomCode,
              passedTests,
              totalTests,
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
      alert(`Submission failed: ${error.message}`);
    } finally {
      setRunning(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      const response = await fetch('http://localhost:3001/api/submissions');
      if (response.ok) {
        const data = await response.json();
        console.log('All submissions:', data.data);
        console.log('Current questionId:', questionId);

        // Filter submissions for current problem (try multiple matching strategies)
        const problemSubmissions = data.data.filter(sub => {
          // Try exact match
          if (sub.problemId === questionId) return true;
          // Try string comparison
          if (String(sub.problemId) === String(questionId)) return true;
          // Try matching if questionId is part of problemId
          if (sub.problemId && sub.problemId.includes && sub.problemId.includes(questionId)) return true;
          // Try matching if problemId is part of questionId
          if (questionId && questionId.includes && questionId.includes(String(sub.problemId))) return true;
          return false;
        });

        console.log('Filtered submissions:', problemSubmissions);
        setSubmissions(problemSubmissions);

        // Check if problem is solved (has at least one successful submission)
        const hasSuccessfulSubmission = problemSubmissions.some(sub => sub.status === 'SUCCESS');
        setIsSolved(hasSuccessfulSubmission);
      } else {
        console.error('Failed to fetch submissions');
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
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2040] text-white flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2040] text-white">
      {/* Header */}
      <nav className="border-b border-gray-800 bg-[#0a0e27]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">{question.title}</h1>
                {isSolved && (
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    ✅ Solved
                  </span>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${question.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                question.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                {question.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isSpectator ? (
                <div className="bg-purple-500/20 text-purple-300 border border-purple-500/50 px-4 py-2 rounded-lg text-sm font-semibold animate-pulse flex items-center gap-2">
                  <span>👁️</span> Spectating Mode
                </div>
              ) : (
                <>
                  <button
                    onClick={runCode}
                    disabled={running || isSolved}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-semibold"
                  >
                    {running ? 'Running...' : 'Run Code'}
                  </button>
                  <button
                    onClick={submitCode}
                    disabled={running || isSolved}
                    className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-semibold"
                  >
                    Submit
                  </button>
                </>
              )}
              {room && (
                <div className="relative">
                  <button
                    onClick={() => setShowParticipants(!showParticipants)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
                    </svg>
                    {room.participants.length}
                  </button>
                  {showParticipants && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#1a1f3a] border border-gray-700 rounded-lg shadow-xl z-50">
                      <div className="p-4">
                        <h3 className="font-semibold text-white mb-3">Room Participants</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {room.participants.map((participant, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-[#0f1425] rounded">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-sm">
                                  {participant.user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-sm truncate">{participant.user.name}</p>
                                <p className="text-xs text-gray-400">
                                  {participant.user._id === room.host._id ? 'Host' : 'Guest'}
                                </p>
                              </div>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-[1fr_250px_1fr] gap-6">
          {/* Left Panel - Problem Description */}
          <div className="bg-[#1a1f3a]/90 border border-gray-700 rounded-xl overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-700 flex">
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
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              {activeTab === 'description' && (
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">Description</h2>
                    <p className="text-gray-300 leading-relaxed">{question.statement || question.description}</p>
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
                    <p className="text-gray-300 text-sm leading-relaxed">{question.constraints}</p>
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
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Your Submissions</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // Debug: Show all submissions
                          fetch('http://localhost:3001/api/submissions')
                            .then(res => res.json())
                            .then(data => {
                              console.log('All submissions in DB:', data.data);
                              const successfulSubmissions = data.data.filter(sub => sub.status === 'SUCCESS');
                              console.log('Successful submissions:', successfulSubmissions);
                              alert(`Total submissions: ${data.data.length}\nSuccessful: ${successfulSubmissions.length}\nCheck console for details`);
                            });
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        🔍 Debug All
                      </button>
                      <button
                        onClick={() => {
                          fetchSubmissions();
                          setTimeout(() => {
                            alert(`Current solved status: ${isSolved ? 'SOLVED' : 'NOT SOLVED'}\nQuestion ID: ${questionId}\nSubmissions found: ${submissions.length}`);
                          }, 1000);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        🎯 Check Status
                      </button>
                      <button
                        onClick={fetchSubmissions}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        🔄 Refresh
                      </button>
                    </div>
                  </div>

                  {loadingSubmissions ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-gray-400">Loading submissions...</p>
                    </div>
                  ) : submissions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>No submissions yet for this problem.</p>
                      <p className="text-sm mt-2">Submit your solution to see it here.</p>
                      <p className="text-xs mt-2 text-gray-500">Debug: Current questionId = {questionId}</p>
                      <p className="text-xs mt-1 text-gray-500">Check browser console for more info</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {submissions.map((submission, index) => (
                        <div
                          key={submission._id}
                          className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {submission.language === 'javascript' && '🟨'}
                                {submission.language === 'python' && '🐍'}
                                {submission.language === 'cpp' && '⚙️'}
                                {submission.language === 'java' && '☕'}
                              </span>
                              <span className="text-sm font-medium capitalize">
                                {submission.language}
                              </span>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded font-medium ${submission.status === 'SUCCESS' ? 'text-green-400 bg-green-900/30' :
                              submission.status === 'COMPILATION_ERROR' ? 'text-red-400 bg-red-900/30' :
                                submission.status === 'RUNTIME_ERROR' ? 'text-orange-400 bg-orange-900/30' :
                                  'text-gray-400 bg-gray-900/30'
                              }`}>
                              {submission.status === 'SUCCESS' && '✅'}
                              {submission.status === 'COMPILATION_ERROR' && '❌'}
                              {submission.status === 'RUNTIME_ERROR' && '💥'}
                              {submission.status !== 'SUCCESS' && submission.status !== 'COMPILATION_ERROR' && submission.status !== 'RUNTIME_ERROR' && '❓'}
                              {' '}{submission.status.replace('_', ' ')}
                            </div>
                          </div>

                          <div className="bg-gray-900 rounded p-3 mb-2">
                            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                              {submission.code}
                            </pre>
                          </div>

                          {submission.output && (
                            <div className="text-sm text-green-400 mb-1">
                              <strong>Output:</strong> {submission.output}
                            </div>
                          )}

                          {submission.error && (
                            <div className="text-sm text-red-400 mb-1">
                              <strong>Error:</strong> {
                                typeof submission.error === 'object'
                                  ? submission.error.message || submission.error.type
                                  : submission.error
                              }
                            </div>
                          )}

                          <div className="text-xs text-gray-500">
                            {new Date(submission.submittedAt).toLocaleString()}
                          </div>

                          {submission.testResults && submission.testResults.length > 0 && (
                            <div className="mt-2 text-sm">
                              <span className="text-green-400">
                                ✅ {submission.passedTests}/{submission.totalTests} tests passed
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Battle Progress Sidebar */}
          {room && (
            <div className="bg-[#1a1f3a]/90 border border-gray-700 rounded-xl p-4 h-[calc(100vh-200px)] overflow-y-auto">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>⚔️</span> Battle Progress
              </h3>
              <div className="space-y-4">
                {room.participants.map(participant => {
                  const progress = participantsProgress[participant.user._id] || {
                    passedTests: 0,
                    totalTests: question?.testCases?.length || 0,
                    percentage: 0,
                    status: 'solving'
                  };

                  return (
                    <div key={participant.user._id} className="bg-[#0f1425] rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm text-white truncate max-w-[100px]">
                          {participant.user.name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${progress.status === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                          'bg-yellow-500/20 text-yellow-400'
                          }`}>
                          {progress.status === 'SUCCESS' ? 'Solved' : 'Solving'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${progress.status === 'SUCCESS' ? 'bg-green-500' : 'bg-cyan-500'
                            }`}
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-xs text-gray-400">
                        {progress.passedTests}/{question?.testCases?.length || 0} tests
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Right Panel - Code Editor */}
          <div className="flex flex-col h-[calc(100vh-200px)]">
            <CodeEditor
              initialCode={code}
              language="cpp"
              onChange={setCode}
              onRun={runCode}
              onSubmit={fetchSubmissions}
              onSubmissionResult={(result) => {
                if (socket && roomCode) {
                  const user = JSON.parse(localStorage.getItem('user') || '{}');
                  socket.emit('submission_result', {
                    roomCode,
                    user,
                    status: result.success ? 'SUCCESS' : 'FAILED',
                    passedTests: result.passedTests,
                    totalTests: result.totalTests
                  });
                }
              }}
              theme="vs-dark"
              questionId={questionId}
              problem={question}
              readOnly={isSpectator || isSolved}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingPlatform;
