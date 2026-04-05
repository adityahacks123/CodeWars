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
        socket.on('join_room', ({ roomCode, userId }) => {
            // Handle both object and string (legacy) for backward compatibility
            const code = typeof roomCode === 'object' ? roomCode.roomCode : roomCode;
            const uid = typeof roomCode === 'object' ? roomCode.userId : userId;

            socket.join(code);

            // Store metadata for disconnect handling
            socket.data.roomCode = code;
            socket.data.userId = uid;

            console.log(`User ${uid || socket.id} joined room: ${code}`);

            // Notify everyone in the room
            io.to(code).emit('user_joined', { userId: uid || socket.id });
        });

        // Leave a room
        socket.on('leave_room', (roomCode) => {
            socket.leave(roomCode);
            console.log(`User ${socket.id} left room: ${roomCode}`);
            io.to(roomCode).emit('user_left', { userId: socket.id });
        });

        // Start battle (Host only)
        socket.on('start_battle', async ({ roomCode, questionId }) => {
            try {
                const room = await Room.findOne({ roomCode });
                if (!room) return;

                // Enforce minimum players
                if (room.participants.length < 2) {
                    socket.emit('error', { message: 'Need at least 2 players to start!' });
                    return;
                }

                console.log(`Battle started in room ${roomCode} for question ${questionId}`);

                // Update room status
                room.status = 'coding';
                room.startedAt = new Date();
                await room.save();

                io.to(roomCode).emit('battle_started', { questionId });
            } catch (err) {
                console.error('Error starting battle:', err);
            }
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
                // Atomic check-and-update to prevent race conditions
                // Only proceed if the room is NOT already completed
                try {
                    const room = await Room.findOneAndUpdate(
                        { roomCode, status: { $ne: 'completed' } },
                        {
                            $set: {
                                status: 'completed',
                                isActive: false,
                                endedAt: new Date()
                            }
                        },
                        { new: true }
                    ).populate('participants.user');

                    if (!room) {
                        console.log(`Room ${roomCode} already completed or not found. Ignoring duplicate win.`);
                        return;
                    }

                    console.log(`🏆 Winner declared in ${roomCode}: ${user.name}`);
                    io.to(roomCode).emit('game_over', { winner: user });

                    // Save battle result asynchronously
                    (async () => {
                        try {
                            const battleResult = new BattleResult({
                                roomId: room._id,
                                question: room.question,
                                winner: user._id,
                                participants: room.participants.map(p => p.user._id),
                                scores: room.participants.map(p => ({
                                    user: p.user._id,
                                    passedTests: p.passedTests,
                                    totalTests: p.totalTests
                                })),
                                duration: Math.floor((Date.now() - new Date(room.createdAt).getTime()) / 1000)
                            });

                            const savedResult = await battleResult.save();
                            console.log(`✅ Battle result saved successfully: ${savedResult._id}`);

                        } catch (err) {
                            console.error('❌ CRITICAL ERROR saving battle result:', err);
                        }
                    })();

                } catch (err) {
                    console.error('Error handling game over:', err);
                }
            }
        });

        socket.on('disconnect', async () => {
            console.log('User disconnected:', socket.id);
            const { roomCode, userId } = socket.data;

            if (roomCode && userId) {
                console.log(`Cleaning up user ${userId} from room ${roomCode}`);
                try {
                    // Remove user from room participants
                    await Room.updateOne(
                        { roomCode },
                        { $pull: { participants: { user: userId } } }
                    );

                    // Check if room is empty
                    const room = await Room.findOne({ roomCode });
                    if (room && room.participants.length === 0) {
                        console.log(`Room ${roomCode} is empty. Closing it.`);
                        room.isActive = false;
                        room.status = 'abandoned';
                        await room.save();
                    } else if (room) {
                        // Notify others
                        io.to(roomCode).emit('user_left', { userId });
                    }
                } catch (err) {
                    console.error('Error handling disconnect:', err);
                }
            }
        });
    });

    return io;
};
