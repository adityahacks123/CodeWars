import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  bio: {
    type: String,
    default: '',
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows null values to be non-unique
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // Stats
  totalProblemsSolved: {
    type: Number,
    default: 0
  },
  easySolved: {
    type: Number,
    default: 0
  },
  mediumSolved: {
    type: Number,
    default: 0
  },
  hardSolved: {
    type: Number,
    default: 0
  },
  // Submission history
  submissionHistory: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    },
    verdict: {
      type: String,
      enum: ['Accepted', 'Wrong Answer', 'Runtime Error', 'Time Limit Exceeded', 'Compilation Error'],
      default: 'Accepted'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    languageUsed: String,
    timeTaken: Number, // in milliseconds
    code: String
  }]
}, {
  timestamps: true
});

// Hash password before saving (only for local auth)
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  // Don't hash if using Google auth
  if (this.authProvider === 'google') return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Method to get public profile
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    avatar: this.avatar,
    authProvider: this.authProvider,
    isVerified: this.isVerified,
    createdAt: this.createdAt
  };
};

// Method to record a submission
userSchema.methods.recordSubmission = async function (questionId, verdict, difficulty, languageUsed, timeTaken, code, problemTitle = 'Unknown Problem', topic = 'General') {
  try {
    // Add to submission history in User document
    this.submissionHistory.push({
      questionId,
      verdict,
      timestamp: new Date(),
      languageUsed,
      timeTaken,
      code
    });

    // If verdict is Accepted, update stats
    if (verdict === 'Accepted') {
      // Check if this problem was already solved
      const alreadySolved = this.submissionHistory.filter(
        sub => sub.questionId.toString() === questionId.toString() && sub.verdict === 'Accepted'
      ).length > 1; // > 1 because we just added the new one

      if (!alreadySolved) {
        // First time solving this problem - update stats
        this.totalProblemsSolved += 1;

        // Update difficulty breakdown
        if (difficulty === 'Easy') {
          this.easySolved += 1;
        } else if (difficulty === 'Medium') {
          this.mediumSolved += 1;
        } else if (difficulty === 'Hard') {
          this.hardSolved += 1;
        }
      }

      // Always save to UserSolved collection (even if already solved before)
      try {
        console.log(`📝 Attempting to save to UserSolved collection...`);
        console.log(`   userId: ${this._id}`);
        console.log(`   problemId: ${questionId}`);
        console.log(`   title: ${problemTitle}`);
        console.log(`   alreadySolved: ${alreadySolved}`);

        const UserSolved = mongoose.model('UserSolved');
        console.log(`✅ UserSolved model retrieved`);

        // Try to update if exists, otherwise create new
        const userSolvedData = {
          userId: this._id,
          problemId: questionId,
          title: problemTitle,
          difficulty,
          topic,
          language: languageUsed,
          code,
          solvedAt: new Date(),
          timeTaken: timeTaken || 0
        };

        console.log(`🔍 Checking for existing record...`);
        const existingRecord = await UserSolved.findOne({
          userId: this._id,
          problemId: questionId
        });

        if (existingRecord) {
          console.log(`📝 Found existing record, updating...`);
          // Update existing record
          await UserSolved.updateOne(
            { userId: this._id, problemId: questionId },
            userSolvedData
          );
          console.log(`✅ Updated UserSolved record for problem: ${problemTitle}`);
        } else {
          console.log(`📝 No existing record, creating new...`);
          // Create new record
          const userSolved = new UserSolved(userSolvedData);
          const saved = await userSolved.save();
          console.log(`✅ Created new UserSolved record for problem: ${problemTitle}`);
          console.log(`   Saved ID: ${saved._id}`);
          console.log(`   Collection name: ${UserSolved.collection.name}`);
          console.log(`   Database name: ${UserSolved.db.name}`);
        }
      } catch (userSolvedError) {
        console.error('❌ Error saving to UserSolved collection:', userSolvedError.message);
        console.error('   Full error:', userSolvedError);
        console.error('   Stack:', userSolvedError.stack);
        // Don't throw - continue even if UserSolved save fails
      }
    }

    const savedUser = await this.save();
    console.log(`💾 User saved to MongoDB. Stats: ${this.totalProblemsSolved} solved`);
    console.log(`   Saved document ID: ${savedUser._id}`);
    console.log(`   Current stats in DB: totalProblemsSolved=${savedUser.totalProblemsSolved}, easy=${savedUser.easySolved}`);
    return savedUser;
  } catch (error) {
    console.error('❌ Error recording submission:', error);
    console.error('   Stack:', error.stack);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

export default User;
