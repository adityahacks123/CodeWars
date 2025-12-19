import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codewars';
console.log('Connecting to MongoDB at:', MONGODB_URI);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const inspectDB = async () => {
    await connectDB();

    try {
        // Check Users collection
        const usersCollection = mongoose.connection.db.collection('users');
        const usersCount = await usersCollection.countDocuments();
        console.log(`\nTotal Users: ${usersCount}`);

        if (usersCount > 0) {
            const users = await usersCollection.find({}).limit(5).toArray();
            console.log('\nSample Users (Top 5):');
            users.forEach(user => {
                console.log(`- ${user.name} (${user.email})`);
                console.log(`  Stats: Total=${user.totalProblemsSolved}, Easy=${user.easySolved}, Medium=${user.mediumSolved}, Hard=${user.hardSolved}`);
                console.log(`  Submissions: ${user.submissionHistory ? user.submissionHistory.length : 0}`);
            });
        }

        // Check UserSolved collection
        const userSolvedCollection = mongoose.connection.db.collection('usersolveds'); // Mongoose pluralizes to lowercase
        const solvedCount = await userSolvedCollection.countDocuments();
        console.log(`\nTotal UserSolved Records: ${solvedCount}`);

        if (solvedCount > 0) {
            const solved = await userSolvedCollection.find({}).limit(5).toArray();
            console.log('\nSample Solved Records:');
            solved.forEach(s => {
                console.log(`- User: ${s.userId}, Problem: ${s.problemId}, Title: ${s.title}`);
            });
        }

    } catch (error) {
        console.error('Error inspecting DB:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

inspectDB();
