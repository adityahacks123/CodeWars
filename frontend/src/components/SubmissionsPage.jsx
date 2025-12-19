import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import * as monaco from 'monaco-editor';

const SubmissionsPage = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filter, setFilter] = useState('all'); // all, success, error
  const [languageFilter, setLanguageFilter] = useState('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        console.error('Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-400 bg-green-900/30';
      case 'COMPILATION_ERROR': return 'text-red-400 bg-red-900/30';
      case 'RUNTIME_ERROR': return 'text-orange-400 bg-orange-900/30';
      case 'TIME_LIMIT_EXCEEDED': return 'text-yellow-400 bg-yellow-900/30';
      case 'WRONG_ANSWER': return 'text-purple-400 bg-purple-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUCCESS': return '✅';
      case 'COMPILATION_ERROR': return '❌';
      case 'RUNTIME_ERROR': return '💥';
      case 'TIME_LIMIT_EXCEEDED': return '⏱️';
      case 'WRONG_ANSWER': return '❌';
      default: return '❓';
    }
  };

  const getLanguageIcon = (language) => {
    switch (language) {
      case 'javascript': return '🟨';
      case 'python': return '🐍';
      case 'cpp': return '⚙️';
      case 'java': return '☕';
      default: return '📄';
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const statusMatch = filter === 'all' ||
      (filter === 'success' && submission.status === 'SUCCESS') ||
      (filter === 'error' && submission.status !== 'SUCCESS');

    const languageMatch = languageFilter === 'all' || submission.language === languageFilter;

    return statusMatch && languageMatch;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">📝 Code Submissions</h1>
          <p className="text-gray-400">View all your submitted code and their results</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Submissions</option>
                <option value="success">Successful Only</option>
                <option value="error">Errors Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Language Filter</label>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Languages</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>

            <div className="flex-1 flex justify-end items-center">
              <button
                onClick={fetchSubmissions}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Submissions List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Submissions ({filteredSubmissions.length})
            </h2>

            {filteredSubmissions.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
                <p>No submissions found</p>
              </div>
            ) : (
              filteredSubmissions.map((submission) => (
                <div
                  key={submission._id}
                  onClick={() => setSelectedSubmission(submission)}
                  className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-700 border ${selectedSubmission?._id === submission._id ? 'border-blue-500' : 'border-gray-700'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getLanguageIcon(submission.language)}</span>
                      <span className="font-medium capitalize">{submission.language}</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submission.status)}`}>
                      {getStatusIcon(submission.status)} {submission.status.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="text-sm text-gray-400 mb-2">
                    Problem ID: {submission.problemId}
                  </div>

                  <div className="text-xs text-gray-500">
                    {formatDate(submission.submittedAt)}
                  </div>

                  {submission.testResults && submission.testResults.length > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="text-green-400">
                        ✅ {submission.passedTests}/{submission.totalTests} tests passed
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Right: Code Preview */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Code Preview</h2>

            {selectedSubmission ? (
              <div className="space-y-4">
                <div className="bg-gray-900 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {getLanguageIcon(selectedSubmission.language)} {selectedSubmission.language.toUpperCase()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(selectedSubmission.status)}`}>
                      {selectedSubmission.status}
                    </span>
                  </div>

                  {/* Code Display */}
                  <div className="bg-black rounded p-3 overflow-x-auto">
                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                      {selectedSubmission.code}
                    </pre>
                  </div>
                </div>

                {/* Output/Error */}
                {selectedSubmission.output && (
                  <div className="bg-gray-900 rounded p-3">
                    <h3 className="text-sm font-medium mb-2 text-green-400">Output:</h3>
                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                      {selectedSubmission.output}
                    </pre>
                  </div>
                )}

                {selectedSubmission.error && (
                  <div className="bg-gray-900 rounded p-3">
                    <h3 className="text-sm font-medium mb-2 text-red-400">Error:</h3>
                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                      {typeof selectedSubmission.error === 'object'
                        ? JSON.stringify(selectedSubmission.error, null, 2)
                        : selectedSubmission.error
                      }
                    </pre>
                  </div>
                )}

                {/* Test Results */}
                {selectedSubmission.testResults && selectedSubmission.testResults.length > 0 && (
                  <div className="bg-gray-900 rounded p-3">
                    <h3 className="text-sm font-medium mb-2 text-blue-400">Test Results:</h3>
                    <div className="space-y-1">
                      {selectedSubmission.testResults.map((test, index) => (
                        <div key={index} className="text-xs flex items-center gap-2">
                          <span>{test.passed ? '✅' : '❌'}</span>
                          <span className={test.passed ? 'text-green-400' : 'text-red-400'}>
                            Test {index + 1}: {test.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p>Select a submission to view code</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionsPage;
