import express from 'express';
import {
  getAllProblems,
  getProblemById,
  getProblemsByDifficulty,
  getProblemsByTopic,
  importProblemsFromJSON,
  getProblemStats,
} from '../controllers/problemController.js';

const router = express.Router();

// Get all problems
router.get('/', getAllProblems);

// Get problem statistics
router.get('/stats', getProblemStats);

// Get problems by difficulty
router.get('/difficulty/:difficulty', getProblemsByDifficulty);

// Get problems by topic
router.get('/topic/:topic', getProblemsByTopic);

// Get single problem by ID
router.get('/:id', getProblemById);

// Import problems from JSON (admin only - one-time setup)
router.post('/import', importProblemsFromJSON);

export default router;
