import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema(
  {
    problemId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    statement: {
      type: String,
      required: true,
    },
    inputFormat: {
      type: String,
      required: true,
    },
    outputFormat: {
      type: String,
      required: true,
    },
    constraints: {
      type: String,
      required: true,
    },
    examples: [
      {
        input: String,
        output: String,
      },
    ],
    testCases: [String],
  },
  { timestamps: true }
);

export default mongoose.model('Problem', problemSchema);
