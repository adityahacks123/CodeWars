import axios from 'axios';

const PISTON_API = 'https://emkc.org/api/v2/piston';

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

/**
 * Execute code against multiple inputs using Piston
 * @param {string} language - The programming language (e.g., 'cpp', 'python')
 * @param {string} code - The source code (including driver if needed)
 * @param {string[]} inputs - Array of input strings
 * @returns {Promise<Array>} - Array of execution results
 */
export const executeCode = async (language, code, inputs) => {
    if (!language || !code) {
        throw new Error('Language and code are required');
    }

    const langConfig = languageMap[language];
    if (!langConfig) {
        throw new Error(`Language '${language}' is not supported`);
    }

    // Prepare inputs
    const inputsToRun = (inputs && Array.isArray(inputs) && inputs.length > 0) ? inputs : [''];
    const results = [];

    for (let i = 0; i < inputsToRun.length; i++) {
        const input = inputsToRun[i];

        // Add small delay to avoid rate limiting (Piston: 5 req/sec)
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        try {
            const response = await axios.post(
                `${PISTON_API}/execute`,
                {
                    language: langConfig.language,
                    version: langConfig.version,
                    files: [
                        {
                            content: code
                        }
                    ],
                    stdin: typeof input === 'string' ? input : JSON.stringify(input)
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const result = response.data;
            const run = result.run || {};

            results.push({
                input: input,
                output: run.stdout ? run.stdout.trim() : '',
                error: run.code !== 0 ? (run.stderr || run.output) : null,
                executionTime: 0, // Piston doesn't always return time in same format
                memoryUsage: 0
            });

        } catch (error) {
            console.error('Piston Execution Error:', error.message);
            results.push({
                input: input,
                output: '',
                error: error.message || 'Execution failed'
            });
        }
    }

    return results;
};
