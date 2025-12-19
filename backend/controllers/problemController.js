import Problem from '../models/Problem.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all problems
export const getAllProblems = async (req, res) => {
  try {
    const problems = await Problem.find().sort({ problemId: 1 });
    res.status(200).json({
      success: true,
      count: problems.length,
      data: problems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching problems',
      error: error.message,
    });
  }
};

// Get single problem by ID (handles both MongoDB _id and problemId)
export const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;
    let problem = null;

    // Try to find by problemId first (numeric)
    const numId = parseInt(id);
    if (!isNaN(numId)) {
      problem = await Problem.findOne({ problemId: numId });
    }

    // If not found and id looks like MongoDB ObjectId, try that
    if (!problem && id.match(/^[0-9a-fA-F]{24}$/)) {
      problem = await Problem.findById(id);
    }

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    res.status(200).json({
      success: true,
      data: problem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching problem',
      error: error.message,
    });
  }
};

// Get problems by difficulty
export const getProblemsByDifficulty = async (req, res) => {
  try {
    const { difficulty } = req.params;
    const problems = await Problem.find({ difficulty }).sort({ problemId: 1 });

    res.status(200).json({
      success: true,
      count: problems.length,
      data: problems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching problems',
      error: error.message,
    });
  }
};

// Get problems by topic
export const getProblemsByTopic = async (req, res) => {
  try {
    const { topic } = req.params;
    const problems = await Problem.find({ topic }).sort({ problemId: 1 });

    res.status(200).json({
      success: true,
      count: problems.length,
      data: problems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching problems',
      error: error.message,
    });
  }
};

// Import problems from JSON file (one-time setup)
export const importProblemsFromJSON = async (req, res) => {
  try {
    // Path to problems.json
    const problemsJsonPath = '/Users/adityasingh/Desktop/DSA-codewars/problems.json';

    // Read the JSON file
    const fileContent = fs.readFileSync(problemsJsonPath, 'utf-8');
    const problems = JSON.parse(fileContent);

    // Clear existing problems (optional)
    await Problem.deleteMany({});

    // Insert new problems
    const insertedProblems = await Problem.insertMany(problems);

    res.status(200).json({
      success: true,
      message: `Successfully imported ${insertedProblems.length} problems`,
      count: insertedProblems.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error importing problems',
      error: error.message,
    });
  }
};

// Get problem statistics
export const getProblemStats = async (req, res) => {
  try {
    const stats = await Problem.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const topicStats = await Problem.aggregate([
      {
        $group: {
          _id: '$topic',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalProblems = await Problem.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalProblems,
        byDifficulty: stats,
        byTopic: topicStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
};
