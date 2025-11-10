import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';

// Boilerplate templates for different languages
// Simple templates - just the function, no main()
const BOILERPLATE_TEMPLATES = {
  javascript: `/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {
    const charIndex = new Map();
    let maxLength = 0;
    let start = 0;
    
    for (let i = 0; i < s.length; i++) {
        const char = s[i];
        if (charIndex.has(char) && charIndex.get(char) >= start) {
            start = charIndex.get(char) + 1;
        }
        charIndex.set(char, i);
        maxLength = Math.max(maxLength, i - start + 1);
    }
    
    return maxLength;
};

// Test Cases
console.log(lengthOfLongestSubstring("abcabcbb"));
console.log(lengthOfLongestSubstring("bbbbb"));
console.log(lengthOfLongestSubstring("pwwkew"));`,

  python: `def lengthOfLongestSubstring(s: str) -> int:
    char_index = {}
    max_length = 0
    start = 0
    
    for i, char in enumerate(s):
        if char in char_index and char_index[char] >= start:
            start = char_index[char] + 1
        char_index[char] = i
        max_length = max(max_length, i - start + 1)
    
    return max_length

# Test Cases
print(lengthOfLongestSubstring("abcabcbb"))
print(lengthOfLongestSubstring("bbbbb"))
print(lengthOfLongestSubstring("pwwkew"))`,

  cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int lengthOfLongestSubstring(string s) {
    unordered_map<char, int> charIndex;
    int maxLength = 0;
    int start = 0;
    
    for (int i = 0; i < s.length(); i++) {
        if (charIndex.find(s[i]) != charIndex.end() && charIndex[s[i]] >= start) {
            start = charIndex[s[i]] + 1;
        }
        charIndex[s[i]] = i;
        maxLength = max(maxLength, i - start + 1);
    }
    
    return maxLength;
}

int main() {
    // Test Case 1
    string s1 = "abcabcbb";
    cout << lengthOfLongestSubstring(s1) << endl;
    
    // Test Case 2
    string s2 = "bbbbb";
    cout << lengthOfLongestSubstring(s2) << endl;
    
    // Test Case 3
    string s3 = "pwwkew";
    cout << lengthOfLongestSubstring(s3) << endl;
    
    return 0;
}`,

  java: `import java.util.*;

public class Solution {
    public static int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> charIndex = new HashMap<>();
        int maxLength = 0;
        int start = 0;
        
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (charIndex.containsKey(c) && charIndex.get(c) >= start) {
                start = charIndex.get(c) + 1;
            }
            charIndex.put(c, i);
            maxLength = Math.max(maxLength, i - start + 1);
        }
        
        return maxLength;
    }
    
    public static void main(String[] args) {
        // Test Case 1
        System.out.println(lengthOfLongestSubstring("abcabcbb"));
        
        // Test Case 2
        System.out.println(lengthOfLongestSubstring("bbbbb"));
        
        // Test Case 3
        System.out.println(lengthOfLongestSubstring("pwwkew"));
    }
}`,

  csharp: `/*
 * @param nums: int[]
 * @param target: int
 * @return: int[]
 */
public class Solution {
    public int[] Solution(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,

  typescript: `/**
 * @param nums: number[]
 * @param target: number
 * @return: number[]
 */
function solution(nums: number[], target: number): number[] {
    // Write your solution here
    return [];
}`,

  go: `/*
 * @param nums: []int
 * @param target: int
 * @return: []int
 */
func solution(nums []int, target int) []int {
    // Write your solution here
    return []int{}
}`,

  rust: `/*
 * @param nums: Vec<i32>
 * @param target: i32
 * @return: Vec<i32>
 */
impl Solution {
    pub fn solution(nums: Vec<i32>, target: i32) -> Vec<i32> {
        // Write your solution here
        vec![]
    }
}`
};

const CodeEditor = ({ 
  initialCode = '', 
  language = 'javascript',
  onChange = () => {},
  onRun = () => {},
  theme = 'vs-dark',
  questionId = ''
}) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

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

  // Update language when it changes
  useEffect(() => {
    if (editor) {
      monaco.editor.setModelLanguage(editor.getModel(), currentLanguage);
    }
  }, [currentLanguage, editor]);

  // Handle Run Code
  const handleRunCode = async () => {
    if (!editor) return;

    const code = editor.getValue();
    setIsRunning(true);
    setOutput('');
    setError('');

    try {
      // Call backend to execute code
      const response = await fetch('http://localhost:3001/api/code/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code,
          language: currentLanguage,
          input: '', // Can be extended for test cases
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOutput(data.output || 'Code executed successfully');
      } else {
        setError(data.error || 'Error executing code');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Handle Submit
  const handleSubmit = async () => {
    if (!editor) return;

    const code = editor.getValue();
    setIsRunning(true);
    setOutput('');
    setError('');

    try {
      // Call backend to validate against test cases
      const response = await fetch('http://localhost:3001/api/code/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code,
          language: currentLanguage,
          questionId: questionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOutput(`✅ All test cases passed!\n\nResults:\n${data.results}`);
      } else {
        setError(data.error || 'Some test cases failed');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Reset Code
  const handleResetCode = () => {
    if (editor) {
      editor.setValue(initialCode);
    }
  };

  // Copy Code
  const handleCopyCode = () => {
    if (editor) {
      const code = editor.getValue();
      navigator.clipboard.writeText(code);
      alert('Code copied to clipboard!');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <select
            value={currentLanguage}
            onChange={(e) => {
              const newLang = e.target.value;
              setCurrentLanguage(newLang);
            }}
            className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="csharp">C#</option>
            <option value="typescript">TypeScript</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
          </select>

          <span className="text-gray-400 text-sm">|</span>

          {/* Theme Info */}
          <span className="text-gray-400 text-sm">
            Theme: {theme === 'vs-dark' ? '🌙 Dark' : '☀️ Light'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Action Buttons */}
          <button
            onClick={handleResetCode}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
            title="Reset to initial code"
          >
            ↻ Reset
          </button>

          <button
            onClick={handleCopyCode}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
            title="Copy code to clipboard"
          >
            📋 Copy
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2"
          >
            {isRunning ? '⏳ Running...' : '▶ Run Code'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2"
          >
            {isRunning ? '⏳ Submitting...' : '✓ Submit'}
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* Output/Error Panel */}
      {(output || error) && (
        <div className="bg-gray-800 border-t border-gray-700 p-4 max-h-40 overflow-y-auto">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-200 p-3 rounded mb-2">
              <div className="font-semibold mb-1">❌ Error:</div>
              <pre className="text-xs whitespace-pre-wrap font-mono">{error}</pre>
            </div>
          )}
          {output && (
            <div className="bg-green-900/30 border border-green-700 text-green-200 p-3 rounded">
              <div className="font-semibold mb-1">✅ Output:</div>
              <pre className="text-xs whitespace-pre-wrap font-mono">{output}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
