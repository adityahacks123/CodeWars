import express from 'express';
import { protect } from '../middleware/auth.js';
import { executeCode } from '../services/codeExecutionService.js';

const router = express.Router();

// @desc    Execute code
// @route   POST /api/code/execute
// @access  Private
router.post('/execute', protect, async (req, res) => {
    try {
        const { language, code, inputs } = req.body;

        const results = await executeCode(language, code, inputs);

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Execution error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error during execution'
        });
    }
});

export default router;
