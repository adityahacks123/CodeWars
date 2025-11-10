import express from 'express';
import { executeCode, submitCode, getExecutionStatus } from '../controllers/codeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Code execution routes
router.post('/execute', protect, executeCode);
router.post('/submit', protect, submitCode);
router.get('/status/:submissionId', protect, getExecutionStatus);

export default router;
