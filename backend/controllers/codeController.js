import axios from 'axios';
import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';

// Helper function to encode string to base64
function encodeBase64(str) {
  return Buffer.from(str).toString('base64');
}

// Helper function to get detailed error message
function getDetailedError(statusId, compileOutput, stderr, stdout) {
  switch (statusId) {
    case 3:
      return { type: 'SUCCESS', message: 'Code executed successfully' };
    case 4:
      return { 
        type: 'WRONG_ANSWER', 
        message: 'Wrong Answer',
        details: stdout || 'Your code ran but produced incorrect output'
      };
    case 5:
      return { 
        type: 'TIME_LIMIT_EXCEEDED', 
        message: 'Time Limit Exceeded',
        details: 'Your code took too long to run. Try optimizing your algorithm.'
      };
    case 6:
      if (compileOutput) {
        // Parse compilation errors for better messages
        const errors = compileOutput.split('\n').filter(line => line.includes('error:'));
        if (errors.length > 0) {
          return {
            type: 'COMPILATION_ERROR',
            message: 'Compilation Error',
            details: errors.join('\n'),
            fixSuggestions: getFixSuggestions(errors)
          };
        }
      }
      return { 
        type: 'COMPILATION_ERROR', 
        message: 'Compilation Error',
        details: compileOutput || 'Your code has syntax errors'
      };
    case 7:
      return { 
        type: 'RUNTIME_ERROR', 
        message: 'Runtime Error',
        details: stderr || 'Your code crashed during execution',
        fixSuggestions: getRuntimeFixSuggestions(stderr)
      };
    case 8:
      return { 
        type: 'MEMORY_LIMIT_EXCEEDED', 
        message: 'Memory Limit Exceeded',
        details: 'Your code used too much memory. Try optimizing memory usage.'
      };
    case 9:
      return { 
        type: 'INTERNAL_ERROR', 
        message: 'Internal Server Error',
        details: 'Something went wrong on our end. Please try again.'
      };
    default:
      return { 
        type: 'UNKNOWN_ERROR', 
        message: 'Unknown Error',
        details: stderr || stdout || 'An unknown error occurred'
      };
  }
}

// Helper function to get fix suggestions for compilation errors
function getFixSuggestions(errors) {
  const suggestions = [];
  
  errors.forEach(error => {
    if (error.includes("'vector' has not been declared")) {
      suggestions.push("Add '#include <vector>' at the top of your file");
    } else if (error.includes("'string' has not been declared")) {
      suggestions.push("Add '#include <string>' at the top of your file");
    } else if (error.includes("'map' has not been declared")) {
      suggestions.push("Add '#include <map>' at the top of your file");
    } else if (error.includes("'set' has not been declared")) {
      suggestions.push("Add '#include <set>' at the top of your file");
    } else if (error.includes("expected ';' before")) {
      suggestions.push("Add a semicolon (;) at the end of the previous line");
    } else if (error.includes("undefined reference to 'main'")) {
      suggestions.push("Add a main() function to your code");
    } else if (error.includes("was not declared in this scope")) {
      suggestions.push("Declare the variable before using it");
    } else if (error.includes("expected primary-expression before")) {
      suggestions.push("Check for missing parentheses or brackets");
    }
  });
  
  return suggestions.length > 0 ? suggestions : ['Check your syntax and includes'];
}

// Helper function to get fix suggestions for runtime errors
function getRuntimeFixSuggestions(stderr) {
  const suggestions = [];
  
  if (stderr) {
    if (stderr.includes("segmentation fault")) {
      suggestions.push("Check for null pointer dereference or array out of bounds");
    } else if (stderr.includes("stack overflow")) {
      suggestions.push("Reduce recursion depth or use iterative approach");
    } else if (stderr.includes("out of range")) {
      suggestions.push("Check array bounds before accessing elements");
    } else if (stderr.includes("division by zero")) {
      suggestions.push("Check for division by zero before performing division");
    }
  }
  
  return suggestions.length > 0 ? suggestions : ['Check your code logic and edge cases'];
}

// Helper function to wrap C++ code with main() function
function wrapCppCode(code) {
  // If code already has main(), return as is
  if (code.includes('int main()') || code.includes('int main(')) {
    return code;
  }
  
  // Build includes at the top
  let includes = '';
  
  // Always add essential headers
  includes += '#include <iostream>\n';
  includes += '#include <vector>\n';
  includes += '#include <string>\n';
  includes += '#include <algorithm>\n';
  includes += '#include <unordered_map>\n';
  includes += '#include <unordered_set>\n';
  includes += '#include <queue>\n';
  includes += '#include <stack>\n';
  includes += '#include <deque>\n';
  includes += '#include <list>\n';
  includes += '#include <map>\n';
  includes += '#include <set>\n';
  includes += '#include <climits>\n';
  includes += '#include <cmath>\n';
  
  // Remove existing includes from code to avoid duplicates
  let codeWithoutIncludes = code.replace(/#include\s*<[^>]+>/g, '').trim();
  
  // Remove existing using namespace std to avoid duplicates
  codeWithoutIncludes = codeWithoutIncludes.replace(/using\s+namespace\s+std\s*;/g, '').trim();
  
  // Add using namespace std
  includes += 'using namespace std;\n';
  
  // Combine everything
  let finalCode = includes + '\n' + codeWithoutIncludes;
  
  // Wrap the code with a simple main() function
  return finalCode + `

int main() {
    Solution sol;
    return 0;
}`;
}

// Helper function to get API configuration (called at runtime, not at import time)
function getJudge0Config() {
  const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
  const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;
  const JUDGE0_HOST = process.env.JUDGE0_HOST || 'judge0-ce.p.rapidapi.com';
  
  return { JUDGE0_API_URL, JUDGE0_API_KEY, JUDGE0_HOST };
}

// Log configuration once when module is first used
let configLogged = false;
function logConfig() {
  if (configLogged) return;
  configLogged = true;
  
  const { JUDGE0_API_KEY, JUDGE0_API_URL, JUDGE0_HOST } = getJudge0Config();
  
  console.log('🔍 Debug - Environment Variables:');
  console.log(`   JUDGE0_API_KEY: ${JUDGE0_API_KEY ? '✓ Set' : '✗ Not set'}`);
  console.log(`   JUDGE0_API_URL: ${JUDGE0_API_URL}`);
  console.log(`   JUDGE0_HOST: ${JUDGE0_HOST}`);
  
  if (JUDGE0_API_KEY) {
    console.log('✅ Judge0 API Key loaded successfully');
    console.log(`✅ Judge0 API URL: ${JUDGE0_API_URL}`);
    console.log(`✅ Judge0 Host: ${JUDGE0_HOST}`);
  } else {
    console.warn('⚠️  WARNING: JUDGE0_API_KEY not found in .env file. Multi-language execution will not work.');
    console.warn('   Make sure JUDGE0_API_KEY is set in /backend/.env');
  }
}

// Language ID mapping for Judge0
const languageMap = {
  'javascript': 63,
  'python': 71,
  'cpp': 54,
  'java': 62,
  'csharp': 51,
  'typescript': 74,
  'go': 60,
  'rust': 73,
};

// @desc    Execute code
// @route   POST /api/code/execute
// @access  Private
export const executeCode = async (req, res) => {
  try {
    // Log config on first use
    logConfig();
    
    const { code, language, input } = req.body;

    // Validate input
    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Code and language are required'
      });
    }

    const languageId = languageMap[language];
    if (!languageId) {
      return res.status(400).json({
        success: false,
        error: `Language '${language}' is not supported`
      });
    }

    let output = '';
    let error = '';

    try {
      if (language === 'javascript') {
        // Execute JavaScript locally (faster)
        const wrappedCode = `
          (function() {
            let output = '';
            const console = {
              log: function(...args) {
                let line = args.map(arg => {
                  if (typeof arg === 'object') {
                    return JSON.stringify(arg);
                  }
                  return String(arg);
                }).join(' ');
                output += line + '\\n';
              }
            };
            
            ${code}
            
            return output;
          })()
        `;

        const func = new Function(wrappedCode);
        output = func() || 'Code executed successfully';
      } else {
        // Use Judge0 API for other languages
        const { JUDGE0_API_KEY, JUDGE0_API_URL, JUDGE0_HOST } = getJudge0Config();
        
        if (!JUDGE0_API_KEY) {
          return res.status(400).json({
            success: false,
            error: `${language.charAt(0).toUpperCase() + language.slice(1)} execution requires Judge0 API key. Please contact admin.`
          });
        }

        try {
          console.log(`📤 Sending ${language} code to Judge0...`);
          console.log(`   Language ID: ${languageId}`);
          console.log(`   API URL: ${JUDGE0_API_URL}`);
          console.log(`   API Key: ${JUDGE0_API_KEY ? 'SET' : 'NOT SET'}`);
          
          // Wrap C++ code with main() if needed
          let finalCode = code;
          if (language === 'cpp') {
            finalCode = wrapCppCode(code);
          }
          
          // Encode code and input to base64
          const encodedCode = encodeBase64(finalCode);
          const encodedInput = encodeBase64(input || '');
          
          // Submit code to Judge0 with base64 encoding
          const response = await axios.post(
            `${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true`,
            {
              source_code: encodedCode,
              language_id: languageId,
              stdin: encodedInput
            },
            {
              headers: {
                'X-RapidAPI-Key': JUDGE0_API_KEY,
                'X-RapidAPI-Host': JUDGE0_HOST,
                'Content-Type': 'application/json'
              }
            }
          );

          const result = response.data;
          console.log(`✅ Judge0 Response Status: ${result.status.id}`);

          // Handle different status codes with detailed error messages
          const errorInfo = getDetailedError(
            result.status.id,
            result.compile_output,
            result.stderr,
            result.stdout
          );
          
          if (errorInfo.type === 'SUCCESS') {
            output = result.stdout || 'Code executed successfully';
          } else {
            error = errorInfo;
          }
        } catch (apiError) {
          console.error('❌ Judge0 API Error:', apiError.message);
          if (apiError.response) {
            console.error('   Status Code:', apiError.response.status);
            console.error('   Response Data:', apiError.response.data);
          }
          error = `Error executing ${language}: ${apiError.message}`;
        }
      }
    } catch (err) {
      error = err.message;
    }

    res.status(200).json({
      success: !error,
      output: output || undefined,
      error: error || undefined
    });

  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Error executing code'
    });
  }
};

// @desc    Submit code and validate against test cases
// @route   POST /api/code/submit
// @access  Private
export const submitCode = async (req, res) => {
  try {
    const { code, language, questionId } = req.body;
    const userId = req.user?.id || 'default_user'; // Get user ID from auth middleware with fallback

    // Validate input
    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Code and language are required'
      });
    }

    let output = '';
    let error = '';
    let testResults = [];
    let passedTests = 0;
    let totalTests = 0;
    let status = 'PENDING';

    try {
      if (language === 'javascript') {
        // Execute JavaScript locally
        const wrappedCode = `
          (function() {
            let output = '';
            const console = {
              log: function(...args) {
                let line = args.map(arg => {
                  if (typeof arg === 'object') {
                    return JSON.stringify(arg);
                  }
                  return String(arg);
                }).join(' ');
                output += line + '\\n';
              }
            };
            
            ${code}
            
            return output;
          })()
        `;

        const func = new Function(wrappedCode);
        output = func() || 'Code executed successfully';
      } else {
        // Use Judge0 API for other languages
        const { JUDGE0_API_KEY, JUDGE0_API_URL, JUDGE0_HOST } = getJudge0Config();
        
        if (!JUDGE0_API_KEY) {
          return res.status(400).json({
            success: false,
            error: `${language.charAt(0).toUpperCase() + language.slice(1)} execution requires Judge0 API key. Please contact admin.`
          });
        }

        const languageId = languageMap[language];
        if (!languageId) {
          return res.status(400).json({
            success: false,
            error: `Language '${language}' is not supported`
          });
        }

        try {
          console.log(`📤 Submitting ${language} code to Judge0...`);
          
          // Wrap C++ code with main() if needed
          let finalCode = code;
          if (language === 'cpp') {
            finalCode = wrapCppCode(code);
          }
          
          // Encode code to base64
          const encodedCode = encodeBase64(finalCode);
          
          const response = await axios.post(
            `${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true`,
            {
              source_code: encodedCode,
              language_id: languageId,
              stdin: ''
            },
            {
              headers: {
                'X-RapidAPI-Key': JUDGE0_API_KEY,
                'X-RapidAPI-Host': JUDGE0_HOST,
                'Content-Type': 'application/json'
              }
            }
          );

          const result = response.data;
          console.log(`✅ Judge0 Response Status: ${result.status.id}`);

          // Handle different status codes with detailed error messages
          const errorInfo = getDetailedError(
            result.status.id,
            result.compile_output,
            result.stderr,
            result.stdout
          );
          
          if (errorInfo.type === 'SUCCESS') {
            output = result.stdout || 'Code executed successfully';
          } else {
            error = errorInfo;
          }
        } catch (apiError) {
          console.error('❌ Judge0 API Error:', apiError.message);
          error = `Error executing ${language}: ${apiError.message}`;
        }
      }
    } catch (err) {
      error = err.message;
    }

    // Determine status based on result
    if (error && typeof error === 'object') {
      status = error.type;
    } else if (error) {
      status = 'ERROR';
    } else {
      status = 'SUCCESS';
    }

    // Save submission to database
    try {
      const submission = new Submission({
        userId,
        problemId: questionId || 'default_problem', // Ensure problemId is not undefined
        code,
        language,
        status,
        output: output || undefined,
        error: error ? (typeof error === 'object' ? error : { message: error }) : undefined,
        testResults,
        passedTests,
        totalTests,
        executionTime: 0, // TODO: Get from Judge0 response
        memoryUsage: 0, // TODO: Get from Judge0 response
      });

      await submission.save();
      console.log(`✅ Submission saved for user ${userId}, problem ${questionId}`);

      // Update user stats if submission is successful
      if (status === 'SUCCESS' && userId !== 'default_user') {
        try {
          const User = (await import('../models/User.js')).default;
          const Problem = (await import('../models/Problem.js')).default;
          
          console.log(`📊 Attempting to update stats for user: ${userId}, problem: ${questionId}`);
          
          const user = await User.findById(userId);
          if (!user) {
            console.error(`❌ User not found: ${userId}`);
            return;
          }
          
          const problem = await Problem.findById(questionId);
          if (!problem) {
            console.error(`❌ Problem not found: ${questionId}`);
            console.log(`📝 Available problem fields: _id, title, difficulty, topic`);
            // Try to find problem by other means
            const allProblems = await Problem.find().limit(1);
            if (allProblems.length > 0) {
              console.log(`📝 Sample problem ID format: ${allProblems[0]._id}`);
            }
            return;
          }
          
          const verdict = status === 'SUCCESS' ? 'Accepted' : 'Wrong Answer';
          console.log(`📝 Recording submission: verdict=${verdict}, difficulty=${problem.difficulty}`);
          
          const updatedUser = await user.recordSubmission(
            questionId,
            verdict,
            problem.difficulty,
            language,
            0, // timeTaken - can be calculated if needed
            code,
            problem.title, // problemTitle
            problem.topic  // topic
          );
          console.log(`✅ User stats updated for ${userId}`);
          console.log(`   Total Solved: ${updatedUser.totalProblemsSolved}`);
          console.log(`   Easy: ${updatedUser.easySolved}, Medium: ${updatedUser.mediumSolved}, Hard: ${updatedUser.hardSolved}`);
          
          // Verify by fetching fresh from DB
          const verifyUser = await User.findById(userId);
          console.log(`🔍 Verification - Fresh fetch from DB:`);
          console.log(`   Total Solved: ${verifyUser.totalProblemsSolved}`);
          console.log(`   Easy: ${verifyUser.easySolved}, Medium: ${verifyUser.mediumSolved}, Hard: ${verifyUser.hardSolved}`);
        } catch (statsError) {
          console.error('⚠️ Error updating user stats:', statsError);
          console.error('Stack:', statsError.stack);
          // Continue even if stats update fails
        }
      }
    } catch (saveError) {
      console.error('❌ Error saving submission:', saveError);
      // Continue with response even if saving fails
    }

    if (error) {
      res.status(200).json({
        success: false,
        error: error,
        submissionSaved: true
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Code executed successfully',
        output: output,
        testResults: {
          passed: passedTests,
          total: totalTests,
          results: testResults
        },
        submissionSaved: true
      });
    }

  } catch (error) {
    console.error('Code submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Error submitting code'
    });
  }
};

// @desc    Get all submissions
// @route   GET /api/submissions
// @access  Public (for now, can be made private)
export const getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find()
      .sort({ submittedAt: -1 })
      .limit(50); // Limit to last 50 submissions

    res.status(200).json({
      success: true,
      data: submissions
    });

  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching submissions'
    });
  }
};

// @desc    Get execution status (for async execution)
// @route   GET /api/code/status/:submissionId
// @access  Private
export const getExecutionStatus = async (req, res) => {
  try {
    const { submissionId } = req.params;

    // TODO: Check status with Judge0 API
    res.status(200).json({
      success: true,
      status: 'pending'
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Error checking status'
    });
  }
};
