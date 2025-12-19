import mongoose from 'mongoose';

const userSolvedSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  solvedAt: {
    type: Date,
    default: Date.now
  },
  timeTaken: {
    type: Number,
    default: 0
  },
  attempts: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Compound index to ensure one entry per user-problem combination
userSolvedSchema.index({ userId: 1, problemId: 1 }, { unique: true });

// Index for efficient queries
userSolvedSchema.index({ userId: 1, solvedAt: -1 });
userSolvedSchema.index({ userId: 1, difficulty: 1 });
userSolvedSchema.index({ userId: 1, topic: 1 });

const UserSolved = mongoose.model('UserSolved', userSolvedSchema, 'user-solved');

export default UserSolved;
