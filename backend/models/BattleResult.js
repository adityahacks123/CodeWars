import mongoose from 'mongoose';

const battleResultSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    duration: {
        type: Number, // in seconds
        required: true
    },
    endedAt: {
        type: Date,
        default: Date.now
    }
});

const BattleResult = mongoose.model('BattleResult', battleResultSchema);

export default BattleResult;
