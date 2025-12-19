import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true,
    enum: ['javascript', 'python', 'cpp', 'java']
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'ERROR', 'WRONG_ANSWER', 'TIME_LIMIT', 'COMPILATION_ERROR', 'RUNTIME_ERROR'],
    default: 'PENDING'
  },
  output: {
    type: String
  },
  error: {
    type: String
  },
  testResults: [{
    passed: Boolean,
    message: String,
    input: String,
    expectedOutput: String,
    actualOutput: String
  }],
  passedTests: {
    type: Number,
    default: 0
  },
  totalTests: {
    type: Number,
    default: 0
  },
  executionTime: {
    type: Number
  },
  memoryUsage: {
    type: Number
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
submissionSchema.index({ userId: 1, problemId: 1 });
submissionSchema.index({ submittedAt: -1 });

export default mongoose.model('Submission', submissionSchema);
