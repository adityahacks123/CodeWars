import axios from 'axios';

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
          
          // Submit code to Judge0
          const response = await axios.post(
            `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
            {
              source_code: code,
              language_id: languageId,
              stdin: input || ''
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

          // Handle different status codes
          if (result.status.id === 3) {
            // Accepted (status 3)
            output = result.stdout || 'Code executed successfully';
          } else if (result.status.id === 4) {
            // Wrong Answer (status 4)
            error = result.stdout || 'Wrong Answer';
          } else if (result.status.id === 5) {
            // Time Limit Exceeded (status 5)
            error = 'Time Limit Exceeded';
          } else if (result.status.id === 6) {
            // Compilation Error (status 6)
            error = result.compile_output || 'Compilation Error';
          } else if (result.status.id === 7) {
            // Runtime Error (status 7)
            error = result.stderr || 'Runtime Error';
          } else {
            output = result.stdout || 'Code executed';
            if (result.stderr) {
              error = result.stderr;
            }
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

    // Validate input
    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Code and language are required'
      });
    }

    // For now, submit works the same as execute
    // TODO: Add actual test case validation in future
    let output = '';
    let error = '';

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
          
          const response = await axios.post(
            `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
            {
              source_code: code,
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

          if (result.status.id === 3) {
            output = result.stdout || 'Code executed successfully';
          } else if (result.status.id === 6) {
            error = result.compile_output || 'Compilation Error';
          } else if (result.status.id === 7) {
            error = result.stderr || 'Runtime Error';
          } else {
            error = result.stderr || result.stdout || 'Execution failed';
          }
        } catch (apiError) {
          console.error('❌ Judge0 API Error:', apiError.message);
          error = `Error executing ${language}: ${apiError.message}`;
        }
      }
    } catch (err) {
      error = err.message;
    }

    if (error) {
      res.status(200).json({
        success: false,
        error: error
      });
    } else {
      res.status(200).json({
        success: true,
        results: `✅ Code executed successfully!\n\nOutput:\n${output}`
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
