import express from 'express';
import Room from '../models/Room.js';
import Question from '../models/Question.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { questionId } = req.body;
    
    if (!questionId) {
      return res.status(400).json({ success: false, message: 'Question ID is required' });
    }

    // Verify the question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Create new room
    const roomCode = await Room.generateRoomCode();
    const room = new Room({
      roomCode,
      question: questionId,
      host: req.user._id,
      participants: [{
        user: req.user._id
      }]
    });

    await room.save();
    
    // Populate question and host details
    await room.populate('question');
    await room.populate('host', 'name email avatar');
    await room.populate('participants.user', 'name email avatar');

    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get user's active rooms
// @route   GET /api/rooms/user/active
// @access  Private
router.get('/user/active', protect, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { host: req.user._id },
        { 'participants.user': req.user._id }
      ],
      isActive: true
    })
      .populate('question')
      .populate('host', 'name email avatar')
      .populate('participants.user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error'
    });
  }
});

// @desc    Leave a room
// @route   PUT /api/rooms/:code/leave
// @access  Private
router.put('/:code/leave', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.code });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Remove user from participants
    room.participants = room.participants.filter(p => p.user.toString() !== req.user._id.toString());
    
    // If room is empty or only host remains, close the room
    if (room.participants.length === 0) {
      room.isActive = false;
    }
    
    await room.save();

    // Populate and return updated room
    await room.populate('question');
    await room.populate('host', 'name email avatar');
    await room.populate('participants.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Left room successfully',
      data: room
    });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error'
    });
  }
});

// @desc    Close a room
// @route   PUT /api/rooms/:code/close
// @access  Private
router.put('/:code/close', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.code });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Only host can close the room
    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only host can close the room' });
    }

    room.isActive = false;
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Room closed successfully'
    });
  } catch (error) {
    console.error('Error closing room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error'
    });
  }
});

// @desc    Join a room
// @route   POST /api/rooms/:code/join
// @access  Private
router.post('/:code/join', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.code });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (!room.isActive) {
      return res.status(400).json({ success: false, message: 'Room is no longer active' });
    }

    // Check if user is already in the room
    const isAlreadyParticipant = room.participants.some(p => p.user.toString() === req.user._id.toString());
    
    if (!isAlreadyParticipant) {
      room.participants.push({
        user: req.user._id
      });
      await room.save();
    }

    // Populate and return
    await room.populate('question');
    await room.populate('host', 'name email avatar');
    await room.populate('participants.user', 'name email avatar');

    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error'
    });
  }
});

// @desc    Get room details by code
// @route   GET /api/rooms/:code
// @access  Private
router.get('/:code', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.code })
      .populate('question')
      .populate('host', 'name email avatar')
      .populate('participants.user', 'name email avatar');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error'
    });
  }
});

export default router;
