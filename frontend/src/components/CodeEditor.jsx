import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import SuccessAnimation from './SuccessAnimation';

// Monaco Editor will use fallback to main thread (acceptable for dev)

// Function to generate boilerplate based on problem type
const generateBoilerplate = (language, problem) => {
  if (!problem) {
    return BOILERPLATE_TEMPLATES[language] || '';
  }

  const title = problem.title || '';
  const statement = problem.statement || '';

  // Detect problem type from title or statement
  const isArray = title.toLowerCase().includes('array') || statement.toLowerCase().includes('array');
  const isLinkedList = title.toLowerCase().includes('linked list') || statement.toLowerCase().includes('listnode');
  const isTree = title.toLowerCase().includes('tree') || statement.toLowerCase().includes('treenode');
  const isString = title.toLowerCase().includes('string') || statement.toLowerCase().includes('string');

  if (language === 'javascript') {
    if (isArray) {
      return `var solution = function(arr) {
    
};`;
    } else if (isLinkedList) {
      return `var solution = function(l1, l2) {
    
};`;
    } else if (isTree) {
      return `var solution = function(root) {
    
};`;
    } else if (isString) {
      return `var solution = function(s) {
    
};`;
    }
  } else if (language === 'python') {
    if (isArray) {
      return `class Solution:
    def solution(self, arr):
        pass`;
    } else if (isLinkedList) {
      return `class Solution:
    def solution(self, l1, l2):
        pass`;
    } else if (isTree) {
      return `class Solution:
    def solution(self, root):
        pass`;
    } else if (isString) {
      return `class Solution:
    def solution(self, s):
        pass`;
    }
  } else if (language === 'cpp') {
    if (isArray) {
      return `#include <vector>
using namespace std;

class Solution {
public:
    int solution(vector<int>& arr) {
        
    }
};`;
    } else if (isLinkedList) {
      return `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* solution(ListNode* l1, ListNode* l2) {
        
    }
};`;
    } else if (isTree) {
      return `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    TreeNode* solution(TreeNode* root) {
        
    }
};`;
    } else if (isString) {
      return `#include <string>
using namespace std;

class Solution {
public:
    int solution(string s) {
        
    }
};`;
    }
  } else if (language === 'java') {
    if (isArray) {
      return `class Solution {
    public int solution(int[] arr) {
        
    }
}`;
    } else if (isLinkedList) {
      return `class Solution {
    public ListNode solution(ListNode l1, ListNode l2) {
        
    }
}`;
    } else if (isTree) {
      return `class Solution {
    public TreeNode solution(TreeNode root) {
        
    }
}`;
    } else if (isString) {
      return `class Solution {
    public int solution(String s) {
        
    }
}`;
    }
  }

  return BOILERPLATE_TEMPLATES[language] || '';
};

// Boilerplate templates for 4 languages - Clean and Simple (fallback)
const BOILERPLATE_TEMPLATES = {
  javascript: `var solution = function(l1, l2) {
    
};`,

  python: `class Solution:
    def solution(self, l1, l2):
        pass`,

  cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int solution(vector<int>& arr) {
        
    }
};`,

  java: `class Solution {
    public int solution(int[] arr) {
        
    }
}`
};

const CodeEditor = ({
  initialCode = '',
  language = 'javascript',
  onChange = () => { },
  onRun = () => { },

  onSubmit = () => { },
  onSubmissionResult = () => { },
  theme = 'vs-dark',
  questionId = '',
  problem = null,
  readOnly = false,
  showToolbar = true
}) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [passedTests, setPassedTests] = useState(0);
  const [totalTests, setTotalTests] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize Monaco Editor
  useEffect(() => {
    if (!containerRef.current) return;

    const newEditor = monaco.editor.create(containerRef.current, {
      value: initialCode,
      language: currentLanguage,
      theme: theme,
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 16,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      fontLigatures: true,
      lineNumbers: 'on',
      lineNumbersMinChars: 3,
      scrollBeyondLastLine: false,
      formatOnPaste: true,
      formatOnType: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      bracketPairColorization: {
        enabled: true,
      },
      'bracketPairColorization.independentColorPoolPerBracketType': true,
      renderWhitespace: 'selection',
      smoothScrolling: true,
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: 'on',
      padding: { top: 16, bottom: 16 },
      lineHeight: 1.6,
      letterSpacing: 0.5,
      readOnly: readOnly,
    });

    setEditor(newEditor);

    // Handle code changes
    const disposable = newEditor.onDidChangeModelContent(() => {
      const code = newEditor.getValue();
      onChange(code);
    });

    return () => {
      disposable.dispose();
      newEditor.dispose();
    };
  }, []);

  useEffect(() => {
    if (editor) {
      editor.updateOptions({ readOnly: readOnly });
    }
  }, [readOnly, editor]);

  // Update editor content when code prop changes
  useEffect(() => {
    if (editor && initialCode !== undefined && editor.getValue() !== initialCode) {
      // Only update if different to avoid cursor jumping
      // But for boilerplate switch, we want to replace.
      // Let's assume if the parent updates 'initialCode', it wants to overwrite.
      editor.setValue(initialCode);
    }
  }, [initialCode, editor]);

  // Update language when it changes
  useEffect(() => {
    if (editor) {
      monaco.editor.setModelLanguage(editor.getModel(), language);
      setCurrentLanguage(language);
    }
  }, [language, editor]);

  // Handle Run Code
  const handleRunCode = async () => {
    if (!editor) return;
    // ... (rest of logic)
  };

  // ... (rest of component)

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      {/* Toolbar */}
      {showToolbar && (
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between flex-wrap gap-3">
          {/* ... (toolbar content) ... */}
        </div>
      )}

      {/* Editor Container */}
      <div className="flex-1 overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />
      </div>



      {/* Output/Error Panel */}
      {
        (output || error || testResults.length > 0) && (
          <div className="bg-gray-800 border-t border-gray-700 p-4 max-h-48 overflow-y-auto">
            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-200 p-3 rounded mb-2">
                <div className="font-semibold mb-1">
                  {error.type === 'COMPILATION_ERROR' && '❌ Compilation Error:'}
                  {error.type === 'RUNTIME_ERROR' && '💥 Runtime Error:'}
                  {error.type === 'TIME_LIMIT_EXCEEDED' && '⏱️ Time Limit Exceeded:'}
                  {error.type === 'MEMORY_LIMIT_EXCEEDED' && '🧠 Memory Limit Exceeded:'}
                  {error.type === 'WRONG_ANSWER' && '❌ Wrong Answer:'}
                  {error.type === 'INTERNAL_ERROR' && '🔧 Internal Error:'}
                  {!error.type && '❌ Error:'}
                </div>

                {error.message && (
                  <div className="text-sm mb-2 font-semibold">{error.message}</div>
                )}

                {error.details && (
                  <pre className="text-xs whitespace-pre-wrap font-mono mb-2">{error.details}</pre>
                )}

                {error.fixSuggestions && error.fixSuggestions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-red-800">
                    <div className="text-sm font-semibold mb-1">💡 Fix Suggestions:</div>
                    <ul className="text-xs space-y-1">
                      {error.fixSuggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {output && (
              <div className="bg-green-900/30 border border-green-700 text-green-200 p-3 rounded mb-2">
                <div className="font-semibold mb-1">✅ Output:</div>
                <pre className="text-xs whitespace-pre-wrap font-mono">{output}</pre>
              </div>
            )}
            {testResults.length > 0 && (
              <div className="bg-blue-900/30 border border-blue-700 text-blue-200 p-3 rounded">
                <div className="font-semibold mb-2">📊 Test Results: {passedTests}/{totalTests} passed</div>
                <div className="space-y-1">
                  {testResults.map((result, idx) => (
                    <div key={idx} className={`text-xs p-2 rounded ${result.passed ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                      <span className={result.passed ? '✅' : '❌'} /> Test {idx + 1}: {result.passed ? 'PASSED' : 'FAILED'}
                      {result.message && <div className="text-xs mt-1">{result.message}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      }

      {/* Success Animation */}
      <SuccessAnimation
        show={showSuccess}
        onComplete={() => setShowSuccess(false)}
      />
    </div >
  );
};

export default CodeEditor;
