import { Server } from 'socket.io';
import BattleResult from './models/BattleResult.js';
import Room from './models/Room.js';

export const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Join a room
        socket.on('join_room', (roomCode) => {
            socket.join(roomCode);
            console.log(`User ${socket.id} joined room: ${roomCode}`);
            // Notify everyone in the room (including sender) so they can update their participant list
            io.to(roomCode).emit('user_joined', { userId: socket.id });
        });

        // Leave a room
        socket.on('leave_room', (roomCode) => {
            socket.leave(roomCode);
            console.log(`User ${socket.id} left room: ${roomCode}`);
            // Notify everyone remaining in the room
            io.to(roomCode).emit('user_left', { userId: socket.id });
        });

        // Start battle (Host only)
        socket.on('start_battle', ({ roomCode, questionId }) => {
            console.log(`Battle started in room ${roomCode} for question ${questionId}`);
            io.to(roomCode).emit('battle_started', { questionId });
        });

        // Code submission result
        socket.on('submission_result', async ({ roomCode, user, status, passedTests, totalTests }) => {
            console.log(`Submission in ${roomCode} by ${user.name}: ${status}`);

            // Emit real-time update to all participants
            io.to(roomCode).emit('opponent_progress', {
                user,
                status,
                passedTests,
                totalTests
            });

            // Update participant progress in database
            try {
                await Room.updateOne(
                    { roomCode, 'participants.user': user._id },
                    {
                        $set: {
                            'participants.$.passedTests': passedTests,
                            'participants.$.totalTests': totalTests,
                            'participants.$.lastSubmissionAt': new Date()
                        }
                    }
                );
                console.log(`Updated progress for ${user.name}: ${passedTests}/${totalTests}`);
            } catch (err) {
                console.error('Failed to update participant progress:', err);
            }

            if (status === 'SUCCESS') {
                io.to(roomCode).emit('game_over', { winner: user });

                // Save battle result asynchronously
                (async () => {
                    try {
                        console.log(`Attempting to save battle result for room: ${roomCode}`);
                        const room = await Room.findOne({ roomCode }).populate('participants.user');

                        if (!room) {
                            console.error(`❌ Room not found for code: ${roomCode}`);
                            return;
                        }

                        console.log(`Found room: ${room._id}, Participants: ${room.participants.length}`);

                        const battleResult = new BattleResult({
                            roomId: room._id,
                            question: room.question,
                            winner: user._id,
                            participants: room.participants.map(p => p.user._id),
                            duration: Math.floor((Date.now() - new Date(room.createdAt).getTime()) / 1000) // Approx duration
                        });

                        const savedResult = await battleResult.save();
                        console.log(`✅ Battle result saved successfully: ${savedResult._id}`);

                        // Mark room as completed
                        room.status = 'completed';
                        room.isActive = false;
                        await room.save();
                        console.log(`Room ${roomCode} marked as completed`);
                    } catch (err) {
                        console.error('❌ CRITICAL ERROR saving battle result:', err);
                        console.error('Error details:', JSON.stringify(err, null, 2));
                    }
                })();
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};
