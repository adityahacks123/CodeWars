// Helper to convert database type to language-specific types
const typeConverter = {
    cpp: (type) => {
        const typeMap = {
            'int': 'int',
            'string': 'string',
            'bool': 'bool',
            'double': 'double',
            'void': 'void',
            'array<int>': 'vector<int>&',
            'array<string>': 'vector<string>&',
            'ListNode*': 'ListNode*',
            'TreeNode*': 'TreeNode*'
        };
        return typeMap[type] || 'int';
    },
    java: (type) => {
        const typeMap = {
            'int': 'int',
            'string': 'String',
            'bool': 'boolean',
            'double': 'double',
            'void': 'void',
            'array<int>': 'int[]',
            'array<string>': 'String[]',
            'ListNode*': 'ListNode',
            'TreeNode*': 'TreeNode'
        };
        return typeMap[type] || 'int';
    },
    python: (type) => type, // Python uses dynamic typing
    javascript: (type) => type // JavaScript uses dynamic typing
};

export const getProblemSignature = (problem) => {
    // Return default if no problem or no signature
    if (!problem) {
        return {
            methodName: 'solution',
            params: [
                { type: 'vector<int>&', name: 'arr', javaType: 'int[]', pyType: 'arr', jsType: 'arr' }
            ],
            returnType: 'int',
            javaReturnType: 'int'
        };
    }

    // Try to use database function signature first
    if (problem.functionSignature && problem.functionSignature.methodName) {
        const sig = problem.functionSignature;

        // Convert parameters to language-specific types
        const params = (sig.parameters || []).map(param => ({
            type: typeConverter.cpp(param.type),
            name: param.name,
            javaType: typeConverter.java(param.type),
            pyType: param.name,
            jsType: param.name
        }));

        return {
            methodName: sig.methodName,
            params: params.length > 0 ? params : [
                { type: 'vector<int>&', name: 'arr', javaType: 'int[]', pyType: 'arr', jsType: 'arr' }
            ],
            returnType: typeConverter.cpp(sig.returnType),
            javaReturnType: typeConverter.java(sig.returnType)
        };
    }

    // Fallback to default signature
    console.warn(`No function signature found for problem: ${problem.title || 'Unknown'}`);
    return {
        methodName: 'solution',
        params: [
            { type: 'vector<int>&', name: 'arr', javaType: 'int[]', pyType: 'arr', jsType: 'arr' }
        ],
        returnType: 'int',
        javaReturnType: 'int'
    };
};

export const transformInput = (input, signature) => {
    // Transform JSON-like input string to space-separated values
    // Example: "[2,7,11,15], 9" -> "4 2 7 11 15 9"

    try {
        // Hacky parser for the specific format "[...], val" or just "[...]"
        // This is fragile but works for the sample problems

        // Remove brackets and replace commas with spaces
        let clean = input.replace(/\[/g, ' ').replace(/\]/g, ' ').replace(/,/g, ' ');

        // Split and filter empty
        const parts = clean.trim().split(/\s+/);

        // If it looks like an array (starts with size? no, we need to infer size)
        // For Two Sum: [2,7,11,15], 9
        // We want: 4 2 7 11 15 9

        // Better approach: Regex to find arrays
        const arrayRegex = /\[(.*?)\]/g;
        let match;
        let transformed = '';
        let lastIndex = 0;

        // If input has arrays
        if (input.includes('[')) {
            let processedInput = input;
            // Replace arrays with "SIZE elements..."
            processedInput = processedInput.replace(arrayRegex, (match, content) => {
                if (!content.trim()) return '0 ';
                const elements = content.split(',').map(s => s.trim());
                return `${elements.length} ${elements.join(' ')}`;
            });

            // Clean up remaining commas
            processedInput = processedInput.replace(/,/g, ' ');
            return processedInput.trim().replace(/\s+/g, ' ');
        }

        return parts.join(' ');
    } catch (e) {
        return input;
    }
};

export const generateBoilerplate = (language, problem) => {
    const sig = getProblemSignature(problem);

    if (language === 'cpp') {
        const params = sig.params.map(p => `${p.type} ${p.name}`).join(', ');
        return `class Solution {
public:
    ${sig.returnType} ${sig.methodName}(${params}) {
        // Write your code here
        return ${sig.returnType === 'void' ? '' : sig.returnType === 'bool' ? 'false' : sig.returnType === 'double' ? '0.0' : sig.returnType === 'vector<int>' ? '{}' : '-1'};
    }
};`;
    }

    if (language === 'java') {
        const params = sig.params.map(p => `${p.javaType} ${p.name}`).join(', ');
        return `class Solution {
    public ${sig.javaReturnType} ${sig.methodName}(${params}) {
        // Write your code here
        return ${sig.javaReturnType === 'void' ? '' : sig.javaReturnType === 'boolean' ? 'false' : sig.javaReturnType === 'double' ? '0.0' : sig.javaReturnType.includes('[]') ? 'new int[]{}' : '-1'};
    }
}`;
    }

    if (language === 'python') {
        const params = sig.params.map(p => p.pyType).join(', ');
        return `class Solution:
    def ${sig.methodName}(self, ${params}):
        # Write your code here
        pass`;
    }

    if (language === 'javascript') {
        const params = sig.params.map(p => p.jsType).join(', ');
        return `/**
${sig.params.map(p => ` * @param {${p.jsType === 'nums' ? 'number[]' : 'number'}} ${p.name}`).join('\n')}
 * @return {${sig.returnType === 'bool' ? 'boolean' : 'number'}}
 */
var ${sig.methodName} = function(${params}) {
    // Write your code here
};`;
    }

    return '';
};

export const getDriverCode = (language, userCode, problem) => {
    const sig = getProblemSignature(problem);

    if (language === 'cpp') {
        // Generate input reading logic based on params
        let inputReading = '';
        sig.params.forEach(p => {
            if (p.type.includes('vector')) {
                inputReading += `
    int n_${p.name};
    if (!(cin >> n_${p.name})) return 0;
    vector<int> ${p.name}(n_${p.name});
    for(int i=0; i<n_${p.name}; i++) cin >> ${p.name}[i];
            `;
            } else {
                inputReading += `
    ${p.type} ${p.name};
    cin >> ${p.name};
            `;
            }
        });

        const args = sig.params.map(p => p.name).join(', ');

        let callAndPrint = '';
        if (sig.returnType === 'void') {
            // Assume first vector parameter is the one to print
            const vectorParam = sig.params.find(p => p.type.includes('vector'));
            const paramToPrint = vectorParam ? vectorParam.name : (sig.params[0] ? sig.params[0].name : '');

            callAndPrint = `
    sol.${sig.methodName}(${args});
    
    cout << "[";
    for(int i=0; i<${paramToPrint}.size(); i++) cout << ${paramToPrint}[i] << (i<${paramToPrint}.size()-1?",":"");
    cout << "]" << endl;
            `;
        } else if (sig.returnType === 'vector<int>') {
            callAndPrint = `
    auto result = sol.${sig.methodName}(${args});
    cout << "[";
    for(int i=0; i<result.size(); i++) cout << result[i] << (i<result.size()-1?",":"");
    cout << "]" << endl;
            `;
        } else {
            callAndPrint = `
    auto result = sol.${sig.methodName}(${args});
    cout << boolalpha << result << endl;
            `;
        }

        return `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <map>
#include <sstream>

using namespace std;

${userCode}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    ${inputReading}
    
    Solution sol;
    ${callAndPrint}
    
    return 0;
}`;
    }

    // ... Implement other languages similarly
    // For brevity, I'll focus on C++ first as requested, but I should add Python at least

    if (language === 'python') {
        let inputReading = `
    import sys
    input = sys.stdin.read().split()
    if not input: return
    iterator = iter(input)
      `;

        sig.params.forEach(p => {
            if (p.pyType === 'nums' || p.pyType === 'nums1' || p.pyType === 'nums2' || p.pyType === 'arr') {
                inputReading += `
    n_${p.name} = int(next(iterator))
    ${p.name} = [int(next(iterator)) for _ in range(n_${p.name})]
              `;
            } else {
                inputReading += `
    ${p.name} = int(next(iterator))
              `;
            }
        });

        const args = sig.params.map(p => p.name).join(', ');

        return `${userCode}

def main():
    ${inputReading}
    
    sol = Solution()
    result = sol.${sig.methodName}(${args})
    
    if isinstance(result, list):
        print(f"[{','.join(map(str, result))}]")
    elif isinstance(result, bool):
        print("true" if result else "false")
    else:
        print(result)

if __name__ == "__main__":
    main()`;
    }

    if (language === 'java') {
        const args = sig.params.map(p => p.name).join(', ');

        let inputReading = '';
        sig.params.forEach(p => {
            if (p.javaType.includes('[]')) {
                inputReading += `
        if (!sc.hasNextInt()) return;
        int n_${p.name} = sc.nextInt();
        ${p.javaType} ${p.name} = new int[n_${p.name}];
        for(int i=0; i<n_${p.name}; i++) if (sc.hasNextInt()) ${p.name}[i] = sc.nextInt();
                `;
            } else {
                inputReading += `
        if (!sc.hasNext()) return;
        ${p.javaType} ${p.name} = sc.next${p.javaType.charAt(0).toUpperCase() + p.javaType.slice(1)}();
                `;
            }
        });

        let callAndPrint = '';
        if (sig.returnType === 'void') {
            const vectorParam = sig.params.find(p => p.type.includes('vector'));
            const paramToPrint = vectorParam ? vectorParam.name : (sig.params[0] ? sig.params[0].name : '');
            callAndPrint = `
        sol.${sig.methodName}(${args});
        printArray(${paramToPrint});
            `;
        } else if (sig.returnType === 'vector<int>') {
            callAndPrint = `
        int[] result = sol.${sig.methodName}(${args});
        printArray(result);
            `;
        } else {
            callAndPrint = `
        ${sig.javaReturnType} result = sol.${sig.methodName}(${args});
        System.out.println(result);
            `;
        }

        return `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        Solution sol = new Solution();
        
        ${inputReading}
        
        ${callAndPrint}
    }
    
    public static void printArray(int[] arr) {
        System.out.print("[");
        for(int i=0; i<arr.length; i++) {
            System.out.print(arr[i] + (i == arr.length-1 ? "" : ","));
        }
        System.out.println("]");
    }
}

${userCode.replace(/public\s+class\s+Solution/g, 'class Solution')}`;
    }

    if (language === 'javascript') {
        const args = sig.params.map(p => p.name).join(', ');

        let inputReading = '';
        sig.params.forEach(p => {
            if (p.jsType === 'nums' || p.jsType === 'arr' || p.type.includes('vector')) {
                inputReading += `
    const n_${p.name} = parseInt(next());
    const ${p.name} = [];
    for(let i=0; i<n_${p.name}; i++) ${p.name}.push(parseInt(next()));
                `;
            } else {
                inputReading += `
    const ${p.name} = ${p.type === 'int' ? 'parseInt(next())' : 'next()'};
                `;
            }
        });

        let callAndPrint = '';
        if (sig.returnType === 'void') {
            const vectorParam = sig.params.find(p => p.type.includes('vector'));
            const paramToPrint = vectorParam ? vectorParam.name : (sig.params[0] ? sig.params[0].name : '');
            callAndPrint = `
    ${sig.methodName}(${args});
    console.log(JSON.stringify(${paramToPrint}));
            `;
        } else {
            callAndPrint = `
    const result = ${sig.methodName}(${args});
    console.log(Array.isArray(result) ? JSON.stringify(result) : result);
            `;
        }

        return `const fs = require('fs');

${userCode}

try {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    let current = 0;
    function next() { return current < input.length ? input[current++] : null; }
    
    ${inputReading}
    
    ${callAndPrint}
} catch (e) {
    console.error(e);
}`;
    }

    return userCode;
};
