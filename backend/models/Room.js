import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    passedTests: {
      type: Number,
      default: 0
    },
    totalTests: {
      type: Number,
      default: 0
    },
    lastSubmissionAt: {
      type: Date
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['waiting', 'coding', 'completed'],
    default: 'waiting'
  },
  startedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 24 * 60 * 60 * 1000)
  }
});

// Generate a random room code
roomSchema.statics.generateRoomCode = async function () {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const existingRoom = await this.findOne({ roomCode: code });
    if (!existingRoom) {
      isUnique = true;
    }
  }

  return code;
};

const Room = mongoose.model('Room', roomSchema, 'active-battles');

export default Room;
