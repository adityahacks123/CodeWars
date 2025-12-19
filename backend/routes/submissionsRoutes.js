import express from 'express';
import Submission from '../models/Submission.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

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
    const { code, language, problemId, status, output, error, testResults } = req.body;

    // Validate required fields
    if (!code || !language || !problemId) {
      return res.status(400).json({
        success: false,
        message: 'Code, language, and problemId are required'
      });
    }

    // Create submission
    const submission = new Submission({
      userId: req.user._id,
      problemId,
      code,
      language,
      status: status || 'PENDING',
      output,
      error,
      testResults,
      submittedAt: new Date()
    });

    await submission.save();

    // Populate references
    await submission.populate('userId', 'name email avatar');
    await submission.populate('problemId', 'title difficulty');

    res.status(201).json({
      success: true,
      data: submission,
      message: 'Submission created successfully'
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
