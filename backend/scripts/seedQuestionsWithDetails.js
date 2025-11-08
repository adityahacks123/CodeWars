import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Question from '../models/Question.js';

const topicMapping = {
  4109: ['Array', 'Greedy', 'Dynamic Programming'],
  4108: ['Array', 'Greedy'],
  4107: ['Array', 'Hash Table'],
  4106: ['String', 'Sorting'],
  4103: ['Database', 'SQL'],
  4101: ['Array', 'Math'],
  4091: ['Database', 'SQL'],
  4084: ['Math', 'Greedy'],
  4083: ['Array', 'Prefix Sum'],
  4081: ['Array', 'Simulation'],
  4080: ['Math', 'Number Theory'],
  4078: ['Array', 'Dynamic Programming'],
  4073: ['String', 'Sorting'],
  4070: ['Array', 'Hash Table'],
  4069: ['Math', 'Combinatorics'],
  4068: ['Array', 'Hash Table'],
  4066: ['Array', 'Hash Table'],
  4063: ['Array', 'Hash Table', 'Prefix Sum'],
  4060: ['Simulation'],
  4059: ['Design', 'Heap'],
  4058: ['Array', 'Math'],
  4056: ['String', 'Dynamic Programming'],
  4055: ['String', 'Dynamic Programming'],
  4053: ['String', 'Hash Table'],
  4052: ['String', 'Hash Table'],
  4051: ['String', 'Math'],
  4050: ['Array', 'Hash Table'],
  4049: ['Array', 'Hash Table'],
  4048: ['Array', 'Greedy'],
  4047: ['Array', 'Dynamic Programming'],
  4045: ['Array', 'Dynamic Programming'],
  4043: ['Array', 'Hash Table'],
  4042: ['Array', 'Greedy'],
  4041: ['Array', 'Dynamic Programming'],
  4039: ['Math', 'String'],
  4037: ['String', 'Greedy'],
  4036: ['Array', 'Prefix Sum'],
  4035: ['Array', 'Greedy'],
  4033: ['Array', 'Bit Manipulation'],
  4029: ['Array', 'Sorting'],
  4027: ['Array', 'Dynamic Programming'],
  4025: ['Database', 'SQL'],
  4023: ['Math', 'Bit Manipulation'],
  4021: ['String', 'Simulation'],
  4020: ['Array', 'Sorting'],
  4019: ['String', 'Stack'],
  4017: ['String', 'Hash Table'],
  4015: ['Array', 'Greedy'],
  4012: ['Array', 'Simulation'],
  4011: ['Array', 'Math'],
};

const getTopicsForQuestion = (questionId) => {
  return topicMapping[questionId] || ['Algorithm'];
};

// Sample problems with real descriptions, examples, and constraints
const sampleProblems = {
  'two-sum': {
    description: 'Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      }
    ],
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
    testCases: [
      { input: '[2,7,11,15], 9', output: '[0,1]' },
      { input: '[3,2,4], 6', output: '[1,2]' },
      { input: '[3,3], 6', output: '[0,1]' }
    ]
  },
  'add-two-numbers': {
    description: 'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list. You may assume the two numbers do not contain any leading zero, except the number 0 itself.',
    examples: [
      {
        input: 'l1 = [2,4,3], l2 = [5,6,4]',
        output: '[7,0,8]',
        explanation: '342 + 465 = 807.'
      },
      {
        input: 'l1 = [0], l2 = [0]',
        output: '[0]',
        explanation: '0 + 0 = 0.'
      }
    ],
    constraints: 'The number of nodes in each linked list is in the range [1, 100].\n0 <= Node.val <= 9\nIt is guaranteed that the list represents a number that does not have leading zeros.',
    testCases: [
      { input: '[2,4,3], [5,6,4]', output: '[7,0,8]' },
      { input: '[0], [0]', output: '[0]' },
      { input: '[9,9,9,9,9,9,9], [9,9,9,9]', output: '[8,9,9,9,0,0,0,1]' }
    ]
  },
  'longest-substring-without-repeating-characters': {
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.'
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.'
      },
      {
        input: 's = "pwwkew"',
        output: '3',
        explanation: 'The answer is "wke", with the length of 3.'
      }
    ],
    constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.',
    testCases: [
      { input: '"abcabcbb"', output: '3' },
      { input: '"bbbbb"', output: '1' },
      { input: '"pwwkew"', output: '3' },
      { input: '""', output: '0' },
      { input: '"au"', output: '2' }
    ]
  },
  'median-of-two-sorted-arrays': {
    description: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).',
    examples: [
      {
        input: 'nums1 = [1,3], nums2 = [2]',
        output: '2.00000',
        explanation: 'merged array = [1,2,3] and median is 2.'
      },
      {
        input: 'nums1 = [1,2], nums2 = [3,4]',
        output: '2.50000',
        explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.'
      }
    ],
    constraints: 'nums1.length == m\nnums2.length == n\n0 <= m <= 1000\n0 <= n <= 1000\n1 <= m + n <= 2000\n-10^6 <= nums1[i], nums2[i] <= 10^6',
    testCases: [
      { input: '[1,3], [2]', output: '2.00000' },
      { input: '[1,2], [3,4]', output: '2.50000' }
    ]
  },
  'palindrome-number': {
    description: 'Given an integer x, return true if x is palindrome integer. An integer is a palindrome when it reads the same backward as forward.',
    examples: [
      {
        input: 'x = 121',
        output: 'true',
        explanation: '121 reads as 121 from left to right and from right to left.'
      },
      {
        input: 'x = -121',
        output: 'false',
        explanation: 'From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.'
      }
    ],
    constraints: '-2^31 <= x <= 2^31 - 1',
    testCases: [
      { input: '121', output: 'true' },
      { input: '-121', output: 'false' },
      { input: '10', output: 'false' }
    ]
  }
};

const seedQuestions = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/codehub';
    console.log(`📡 Connecting to MongoDB: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Fetch from LeetCode API
    console.log('🌐 Fetching questions from LeetCode API...');
    const response = await fetch('https://leetcode.com/api/problems/all/');
    
    if (!response.ok) {
      throw new Error(`LeetCode API error: ${response.status}`);
    }

    const leetcodeData = await response.json();
    console.log(`✅ Fetched ${leetcodeData.num_total} total problems from LeetCode`);

    // Get first 50 problems
    const problemsToFetch = leetcodeData.stat_status_pairs.slice(0, 50);

    console.log(`\n📝 Processing ${problemsToFetch.length} problems...`);
    
    const questions = [];
    const sampleKeys = Object.keys(sampleProblems);
    
    for (let i = 0; i < problemsToFetch.length; i++) {
      const item = problemsToFetch[i];
      const stat = item.stat;
      const difficulty = ['Easy', 'Medium', 'Hard'][item.difficulty.level - 1];
      const questionId = stat.question_id;
      const topics = getTopicsForQuestion(questionId);

      // Show progress
      if ((i + 1) % 10 === 0) {
        console.log(`   ⏳ Processing ${i + 1}/${problemsToFetch.length}...`);
      }

      // Use sample data for first 5 problems, generic for others
      let problemData;
      if (i < sampleKeys.length) {
        problemData = sampleProblems[sampleKeys[i]];
      } else {
        problemData = {
          description: `Given a problem, solve it efficiently.\n\nThis is LeetCode Problem #${questionId}: ${stat.question__title}`,
          examples: [
            {
              input: 'Example 1 input',
              output: 'Example 1 output',
              explanation: 'Explanation for example 1'
            },
            {
              input: 'Example 2 input',
              output: 'Example 2 output',
              explanation: 'Explanation for example 2'
            }
          ],
          constraints: 'Constraints:\n- Time Complexity: O(n)\n- Space Complexity: O(1)\n- See LeetCode for detailed constraints',
          testCases: [
            { input: 'test case 1', output: 'expected output 1' },
            { input: 'test case 2', output: 'expected output 2' },
            { input: 'test case 3', output: 'expected output 3' }
          ]
        };
      }

      questions.push({
        title: stat.question__title,
        description: problemData.description,
        difficulty: difficulty,
        topics: topics,
        examples: problemData.examples,
        constraints: problemData.constraints,
        starterCode: `function solution() {
  // Problem: ${stat.question__title}
  // TODO: Write your solution here
}`,
        solutionCode: `// Solution for ${stat.question__title}
// Visit: https://leetcode.com/problems/${stat.question__slug}/
function solution() {
  // Check LeetCode for accepted solutions
}`,
        testCases: problemData.testCases,
        acceptanceRate: stat.total_acs ? (stat.total_acs / stat.total_submitted * 100).toFixed(1) : 0,
        submissions: stat.total_submitted || 0,
        leetcodeId: questionId,
        leetcodeSlug: stat.question__slug,
        leetcodeUrl: `https://leetcode.com/problems/${stat.question__slug}/`
      });
    }

    console.log(`\n📝 Transformed ${questions.length} questions`);

    // Clear existing questions
    console.log('🗑️  Clearing existing questions...');
    const deleteResult = await Question.deleteMany({});
    console.log(`✅ Cleared ${deleteResult.deletedCount} existing questions`);

    // Insert questions
    console.log(`📝 Inserting ${questions.length} questions with real details...`);
    const result = await Question.insertMany(questions);
    console.log(`✅ Successfully seeded ${result.length} questions`);
    
    // Verify insertion
    const count = await Question.countDocuments();
    console.log(`📊 Total questions in database: ${count}`);

    // Get all unique topics
    const topics = await Question.distinct('topics');
    console.log(`\n📊 Total unique topics: ${topics.length}`);
    console.log('📋 Topics found:');
    topics.sort().forEach((topic, index) => {
      console.log(`   ${index + 1}. ${topic}`);
    });

    // Show difficulty breakdown
    const easyCount = await Question.countDocuments({ difficulty: 'Easy' });
    const mediumCount = await Question.countDocuments({ difficulty: 'Medium' });
    const hardCount = await Question.countDocuments({ difficulty: 'Hard' });
    console.log(`\n📈 Difficulty Breakdown:`);
    console.log(`   Easy: ${easyCount}`);
    console.log(`   Medium: ${mediumCount}`);
    console.log(`   Hard: ${hardCount}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('\n🎉 Seeding completed successfully!');
    console.log(`\n📚 Questions are now available at: http://localhost:3001/api/questions`);
  } catch (error) {
    console.error('❌ Error seeding:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

seedQuestions();
