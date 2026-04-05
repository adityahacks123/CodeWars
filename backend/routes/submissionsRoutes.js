import express from 'express';
import Submission from '../models/Submission.js';
import { protect } from '../middleware/auth.js';
import axios from 'axios';
import Problem from '../models/Problem.js';
import { executeCode } from '../services/codeExecutionService.js';

const router = express.Router();

// Helper function to get API configuration
function getJudge0Config() {
  const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
  const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;
  const JUDGE0_HOST = process.env.JUDGE0_HOST || 'judge0-ce.p.rapidapi.com';

  return { JUDGE0_API_URL, JUDGE0_API_KEY, JUDGE0_HOST };
}

// Language mapping for Piston
const languageMap = {
  'javascript': { language: 'javascript', version: '18.15.0' },
  'python': { language: 'python', version: '3.10.0' },
  'cpp': { language: 'c++', version: '10.2.0' },
  'java': { language: 'java', version: '15.0.2' },
  'csharp': { language: 'csharp', version: '6.12.0' },
  'typescript': { language: 'typescript', version: '5.0.3' },
  'go': { language: 'go', version: '1.16.2' },
  'rust': { language: 'rust', version: '1.68.2' },
};

// Helper function to encode string to base64
function encodeBase64(str) {
  return Buffer.from(str).toString('base64');
}

// Helper function to generate C++ driver code
function generateCppDriver(userCode, problem) {
  const { methodName, parameters, returnType } = problem.functionSignature;

  let includes = `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <stack>
#include <cmath>
#include <climits>
#include <iomanip>

using namespace std;

// Helper to print vector
template<typename T>
void printVector(const vector<T>& v) {
    for(int i=0; i<v.size(); i++) {
        cout << v[i] << (i == v.size()-1 ? "" : " ");
    }
    cout << endl;
}

`;

  // Clean user code (remove includes and using namespace std to avoid duplicates)
  let cleanUserCode = userCode.replace(/#include\s*<[^>]+>/g, '').replace(/using\s+namespace\s+std\s*;/g, '').trim();

  let mainFunction = `
int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int T;
    if (!(cin >> T)) return 0;
    while(T--) {
        Solution sol;
        
        // Read input based on parameters
`;

  // Generate input reading logic
  parameters.forEach((param, index) => {
    const paramName = `p${index}`;
    const paramType = param.type;

    if (paramType === 'int') {
      mainFunction += `
    int ${paramName};
    if (!(cin >> ${paramName})) return 0;
`;
    } else if (paramType === 'long') {
      mainFunction += `
    long long ${paramName};
    if (!(cin >> ${paramName})) return 0;
`;
    } else if (paramType === 'double') {
      mainFunction += `
    double ${paramName};
    if (!(cin >> ${paramName})) return 0;
`;
    } else if (paramType === 'string') {
      mainFunction += `
    string ${paramName};
    if (!(cin >> ${paramName})) return 0;
`;
    } else if (paramType === 'array<int>' || paramType === 'vector<int>') {
      mainFunction += `
    int n${index};
    if (!(cin >> n${index})) return 0;
    vector<int> ${paramName}(n${index});
    for(int i=0; i<n${index}; i++) {
        cin >> ${paramName}[i];
    }
`;
    }
  });

  // Generate function call
  const args = parameters.map((_, i) => `p${i}`).join(', ');

  if (returnType === 'void') {
    mainFunction += `
    // Call solution
    sol.${methodName}(${args});
    
    // Print first vector argument (assuming in-place modification)
    printVector(p0); 
    cout << "###BATCH###" << endl;
    }
    return 0;
}
`;
  } else if (returnType === 'vector<int>' || returnType === 'array<int>') {
    mainFunction += `
    // Call solution
    vector<int> result = sol.${methodName}(${args});
    
    // Print result
    printVector(result);
    cout << "###BATCH###" << endl;
    }
    return 0;
}
`;
  } else {
    mainFunction += `
    // Call solution
    ${returnType} result = sol.${methodName}(${args});
    
    // Print result
    cout << result << endl;
    cout << "###BATCH###" << endl;
    }
    return 0;
}
`;
  }

  return includes + cleanUserCode + mainFunction;
}

// Helper function to generate Java driver code
function generateJavaDriver(userCode, problem) {
  const { methodName, parameters, returnType } = problem.functionSignature;

  // We need to wrap user's Solution class and Main class
  // User code is "class Solution { ... }"
  // We will append "public class Main { ... }"

  let imports = `import java.util.*;
import java.io.*;
`;

  let mainClass = `
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int T = sc.nextInt();
        while (T-- > 0) {
            Solution sol = new Solution();
        
            // Read input based on parameters
`;

  // Generate input reading logic
  parameters.forEach((param, index) => {
    const paramName = `p${index}`;
    const paramType = param.type; // This is the generic type, we need Java type

    // Map generic types to Java types
    let javaType = 'int';
    let readLogic = `if (!sc.hasNext()) return; int ${paramName} = sc.nextInt();`;

    if (paramType === 'int') {
      javaType = 'int';
      readLogic = `if (!sc.hasNextInt()) return; int ${paramName} = sc.nextInt();`;
    } else if (paramType === 'long') {
      javaType = 'long';
      readLogic = `if (!sc.hasNextLong()) return; long ${paramName} = sc.nextLong();`;
    } else if (paramType === 'double') {
      javaType = 'double';
      readLogic = `if (!sc.hasNextDouble()) return; double ${paramName} = sc.nextDouble();`;
    } else if (paramType === 'string') {
      javaType = 'String';
      readLogic = `if (!sc.hasNext()) return; String ${paramName} = sc.next();`;
    } else if (paramType === 'array<int>' || paramType === 'vector<int>') {
      javaType = 'int[]';
      readLogic = `
        if (!sc.hasNextInt()) return;
        int n${index} = sc.nextInt();
        int[] ${paramName} = new int[n${index}];
        for(int i=0; i<n${index}; i++) {
            if (sc.hasNextInt()) ${paramName}[i] = sc.nextInt();
        }
        `;
    }

    mainClass += readLogic + '\n';
  });

  // Generate function call
  const args = parameters.map((_, i) => `p${i}`).join(', ');

  if (returnType === 'void') {
    mainClass += `
        // Call solution
        sol.${methodName}(${args});
        
        // Print first array argument (assuming in-place modification)
        // Check if p0 is array
        printArray(p0);
        System.out.println("###BATCH###");
        }
    }
    
    public static void printArray(int[] arr) {
        System.out.print("[");
        for(int i=0; i<arr.length; i++) {
            System.out.print(arr[i] + (i == arr.length-1 ? "" : ","));
        }
        System.out.println("]");
    }
    
    // Overload for other types if needed
    public static void printArray(Object o) { System.out.println(o); }
}
`;
  } else if (returnType === 'vector<int>' || returnType === 'array<int>') {
    mainClass += `
        // Call solution
        int[] result = sol.${methodName}(${args});
        
        // Print result
        printArray(result);
        System.out.println("###BATCH###");
        }
    }
    
    public static void printArray(int[] arr) {
        System.out.print("[");
        for(int i=0; i<arr.length; i++) {
            System.out.print(arr[i] + (i == arr.length-1 ? "" : ","));
        }
        System.out.println("]");
    }
}
`;
  } else {
    // Java return type mapping
    let javaReturnType = 'int';
    if (returnType === 'bool') javaReturnType = 'boolean';
    else if (returnType === 'string') javaReturnType = 'String';
    else if (returnType === 'double') javaReturnType = 'double';

    mainClass += `
        // Call solution
        ${javaReturnType} result = sol.${methodName}(${args});
        
        // Print result
        System.out.println(result);
        System.out.println("###BATCH###");
        }
    }
    
    public static void printArray(int[] arr) {
        System.out.print("[");
        for(int i=0; i<arr.length; i++) {
            System.out.print(arr[i] + (i == arr.length-1 ? "" : ","));
        }
        System.out.println("]");
    }
}
`;
  }

  // Combine: Imports + User Code + Main Class
  // Note: Piston runs "Main.java", so public class Main is required.
  // User code usually has "class Solution". We can put both in same file, but only one public class.
  // We'll remove "public" from user's class if present, just in case.

  let cleanUserCode = userCode.replace(/public\s+class\s+Solution/g, 'class Solution');

  return imports + mainClass + '\n' + cleanUserCode;
}

// Helper function to generate Python driver code
function generatePythonDriver(userCode, problem) {
  const { methodName, parameters, returnType } = problem.functionSignature;

  let driverCode = `
import sys

# User Code
${userCode}

# Driver Code
def main():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    iterator = iter(input_data)
    try:
        T = int(next(iterator))
        for _ in range(T):
            sol = Solution()
        
            # Read inputs
`;

  // Generate input reading logic
  parameters.forEach((param, index) => {
    const paramName = `p${index}`;
    const paramType = param.type;

    if (paramType === 'int') {
      driverCode += `        ${paramName} = int(next(iterator))\n`;
    } else if (paramType === 'long') {
      driverCode += `        ${paramName} = int(next(iterator))\n`;
    } else if (paramType === 'double') {
      driverCode += `        ${paramName} = float(next(iterator))\n`;
    } else if (paramType === 'string') {
      driverCode += `        ${paramName} = next(iterator)\n`;
    } else if (paramType === 'array<int>' || paramType === 'vector<int>') {
      driverCode += `        n${index} = int(next(iterator))\n`;
      driverCode += `        ${paramName} = [int(next(iterator)) for _ in range(n${index})]\n`;
    }
  });

  // Generate function call
  const args = parameters.map((_, i) => `p${i}`).join(', ');

  if (returnType === 'void') {
    driverCode += `
        # Call solution
        sol.${methodName}(${args})
        
        # Print first array argument (assuming in-place modification)
        # Check if p0 is list
        if isinstance(p0, list):
            print(f"[{','.join(map(str, p0))}]")
        else:
            print(p0)
        print("###BATCH###")
            
    except StopIteration:
        pass
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
`;
  } else if (returnType === 'vector<int>' || returnType === 'array<int>') {
    driverCode += `
        # Call solution
        result = sol.${methodName}(${args})
        
        # Print result
        if isinstance(result, list):
            print(f"[{','.join(map(str, result))}]")
        else:
            print(result)
        print("###BATCH###")
            
    except StopIteration:
        pass
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
`;
  } else {
    driverCode += `
        # Call solution
        result = sol.${methodName}(${args})
        
        # Print result
        if isinstance(result, bool):
            print("true" if result else "false")
        else:
            print(result)
        print("###BATCH###")
            
    except StopIteration:
        pass
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
`;
  }

  return driverCode;
}

// Helper function to generate JavaScript driver code
function generateJsDriver(userCode, problem) {
  const { methodName, parameters, returnType } = problem.functionSignature;

  let driverCode = `
const fs = require('fs');

// User Code
${userCode}

// Driver Code
try {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    let current = 0;
    
    function next() {
        if (current >= input.length) return null;
        return input[current++];
    }
    
    // Read inputs
    const T = parseInt(next());
    for(let t=0; t<T; t++) {
`;

  // Generate input reading logic
  parameters.forEach((param, index) => {
    const paramName = `p${index}`;
    const paramType = param.type;

    if (paramType === 'int') {
      driverCode += `    const ${paramName} = parseInt(next());\n`;
    } else if (paramType === 'long') {
      driverCode += `    const ${paramName} = parseInt(next());\n`;
    } else if (paramType === 'double') {
      driverCode += `    const ${paramName} = parseFloat(next());\n`;
    } else if (paramType === 'string') {
      driverCode += `    const ${paramName} = next();\n`;
    } else if (paramType === 'array<int>' || paramType === 'vector<int>') {
      driverCode += `    const n${index} = parseInt(next());\n`;
      driverCode += `    const ${paramName} = [];\n`;
      driverCode += `    for(let i=0; i<n${index}; i++) ${paramName}.push(parseInt(next()));\n`;
    }
  });

  // Generate function call
  const args = parameters.map((_, i) => `p${i}`).join(', ');

  if (returnType === 'void') {
    driverCode += `
    // Call solution
    ${methodName}(${args});
    
    // Print first array argument (assuming in-place modification)
    // Check if p0 is array
    if (Array.isArray(p0)) {
        console.log(JSON.stringify(p0));
    } else {
        console.log(p0);
    }
    console.log("###BATCH###");
    }
    
} catch (e) {
    console.error(e);
}
`;
  } else if (returnType === 'vector<int>' || returnType === 'array<int>') {
    driverCode += `
    // Call solution
    const result = ${methodName}(${args});
    
    // Print result
    if (Array.isArray(result)) {
        console.log(JSON.stringify(result));
    } else {
        console.log(result);
    }
    console.log("###BATCH###");
    }
    
} catch (e) {
    console.error(e);
}
`;
  } else {
    driverCode += `
    // Call solution
    const result = ${methodName}(${args});
    
    // Print result
    console.log(result);
    console.log("###BATCH###");
    }
    
} catch (e) {
    console.error(e);
}
`;
  }

  return driverCode;
}

// @desc    Get all submissions (for current user or all if admin)
// @route   GET /api/submissions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.user._id })
      .populate('userId', 'name email avatar')
      .populate('problemId', 'title difficulty')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      data: submissions,
      count: submissions.length
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions'
    });
  }
});

// @desc    Get submissions for a specific problem
// @route   GET /api/submissions/problem/:problemId
// @access  Private
router.get('/problem/:problemId', protect, async (req, res) => {
  try {
    const submissions = await Submission.find({
      userId: req.user._id,
      problemId: req.params.problemId
    })
      .populate('userId', 'name email avatar')
      .populate('problemId', 'title difficulty')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      data: submissions,
      count: submissions.length
    });
  } catch (error) {
    console.error('Error fetching problem submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions'
    });
  }
});

// @desc    Get a single submission
// @route   GET /api/submissions/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('userId', 'name email avatar')
      .populate('problemId', 'title difficulty');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if user owns this submission
    if (submission.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this submission'
      });
    }

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submission'
    });
  }
});

// @desc    Create a new submission
// @route   POST /api/submissions
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { code, language, problemId } = req.body;

    // Validate required fields
    if (!code || !language || !problemId) {
      return res.status(400).json({
        success: false,
        message: 'Code, language, and problemId are required'
      });
    }

    // 1. Fetch Problem
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    // 2. Prepare Execution
    const { JUDGE0_API_KEY, JUDGE0_API_URL, JUDGE0_HOST } = getJudge0Config();
    const langConfig = languageMap[language];

    if (!langConfig) {
      return res.status(400).json({ success: false, message: `Language '${language}' is not supported` });
    }

    // Prepare driver code once
    let finalCode = code;
    if (language === 'cpp') {
      finalCode = generateCppDriver(code, problem);
    } else if (language === 'java') {
      finalCode = generateJavaDriver(code, problem);
    } else if (language === 'python') {
      finalCode = generatePythonDriver(code, problem);
    } else if (language === 'javascript') {
      finalCode = generateJsDriver(code, problem);
    }

    let testResults = [];
    let passedTests = 0;
    let overallStatus = 'SUCCESS';
    let overallError = null;
    let firstOutput = '';

    // 3. Execute against Test Cases (Batch Mode)
    const totalTests = problem.testCases.length;

    console.log(`[Batch] Preparing ${totalTests} test cases...`);
    const startTime = Date.now();

    // Construct Batch Input
    // Format: TotalTests \n Input1 \n Input2 ...
    // Note: Inputs might be multi-line, so we just join them.
    // The driver reads T, then loops T times reading the specific input format.
    let fullInput = `${totalTests}\n`;
    for (const tc of problem.testCases) {
      const input = typeof tc === 'string' ? tc : tc.input;
      fullInput += input + '\n';
    }

    try {
      console.log(`[Batch] Sending to Piston (Input size: ${fullInput.length} chars)...`);
      const response = await axios.post(
        'https://emkc.org/api/v2/piston/execute',
        {
          language: langConfig.language,
          version: langConfig.version,
          files: [
            {
              content: finalCode
            }
          ],
          stdin: fullInput
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const pistonDuration = Date.now() - startTime;
      console.log(`[Batch] Piston response received in ${pistonDuration}ms`);

      const result = response.data;
      const run = result.run || {};

      if (run.code !== 0 && !run.stdout) {
        // Compilation error or runtime error before any output
        overallStatus = 'ERROR';
        overallError = run.stderr || run.output;
        // All tests failed
        for (let i = 0; i < totalTests; i++) {
          const tc = problem.testCases[i];
          testResults.push({
            input: typeof tc === 'string' ? tc : tc.input,
            output: '',
            expected: typeof tc === 'string' ? '' : tc.output,
            passed: false,
            error: overallError
          });
        }
      } else {
        // Parse Output
        // Split by delimiter "###BATCH###"
        // Note: The last one might have a trailing newline before delimiter
        const rawOutput = run.stdout || '';
        const outputs = rawOutput.split('###BATCH###').map(s => s.trim()).filter((s, i) => i < totalTests); // Filter to match count

        // If runtime error occurred mid-way, we might have fewer outputs
        if (run.code !== 0) {
          overallStatus = 'ERROR';
          overallError = run.stderr;
        }

        for (let i = 0; i < totalTests; i++) {
          const testCase = problem.testCases[i];
          const input = typeof testCase === 'string' ? testCase : testCase.input;
          const expected = typeof testCase === 'string' ? '' : testCase.output;

          const actualOutput = outputs[i] || ''; // Might be undefined if crashed earlier
          const isCorrect = actualOutput === expected.trim();

          if (isCorrect) passedTests++;
          if (!firstOutput) firstOutput = actualOutput;

          // If this specific test failed (and we have output), mark as WRONG_ANSWER
          // If we don't have output (crashed), it's ERROR
          let status = 'SUCCESS';
          let error = null;

          if (!outputs[i] && run.code !== 0) {
            status = 'ERROR';
            error = run.stderr;
          } else if (!isCorrect) {
            status = 'WRONG_ANSWER';
            if (overallStatus === 'SUCCESS') overallStatus = 'WRONG_ANSWER';

            // Log first failure for debugging
            if (passedTests === 0 && i === 0) {
              console.log('--- DEBUG: First Test Case Failed ---');
              console.log('Input:', input);
              console.log('Expected:', expected);
              console.log('Actual:', actualOutput);
              console.log('-------------------------------------');
            }
          }

          testResults.push({
            input: input,
            output: actualOutput,
            expected: expected,
            passed: isCorrect,
            error: error
          });
        }
      }

    } catch (err) {
      console.error('Error executing batch:', err.message);
      overallStatus = 'INTERNAL_ERROR';
      overallError = err.message;
    }

    console.log(`Submission Result: ${overallStatus} (${passedTests}/${totalTests})`);

    // 4. Create submission
    const submission = new Submission({
      userId: req.user._id,
      problemId,
      code,
      language,
      status: overallStatus,
      output: firstOutput,
      error: overallError ? { message: overallError } : undefined,
      testResults,
      passedTests,
      totalTests,
      submittedAt: new Date()
    });

    await submission.save();

    // Populate references
    await submission.populate('userId', 'name email avatar');
    await submission.populate('problemId', 'title difficulty');

    res.status(201).json({
      success: true,
      data: submission,
      message: overallStatus === 'SUCCESS' ? 'Solution Accepted' : 'Solution Failed'
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating submission'
    });
  }
});

// @desc    Update a submission
// @route   PUT /api/submissions/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if user owns this submission
    if (submission.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this submission'
      });
    }

    // Update fields
    const { status, output, error, testResults } = req.body;
    if (status) submission.status = status;
    if (output) submission.output = output;
    if (error) submission.error = error;
    if (testResults) submission.testResults = testResults;

    await submission.save();

    // Populate references
    await submission.populate('userId', 'name email avatar');
    await submission.populate('problemId', 'title difficulty');

    res.status(200).json({
      success: true,
      data: submission,
      message: 'Submission updated successfully'
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating submission'
    });
  }
});

// @desc    Delete a submission
// @route   DELETE /api/submissions/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if user owns this submission
    if (submission.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this submission'
      });
    }

    await Submission.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting submission'
    });
  }
});

export default router;
