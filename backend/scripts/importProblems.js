import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import Problem from '../models/Problem.js';

dotenv.config();

const importProblems = async () => {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Read problems.json
    const problemsJsonPath = '/Users/adityasingh/Desktop/DSA-codewars/problems.json';
    console.log(`📖 Reading problems from: ${problemsJsonPath}`);
    
    const fileContent = fs.readFileSync(problemsJsonPath, 'utf-8');
    const problems = JSON.parse(fileContent);
    console.log(`📚 Loaded ${problems.length} problems from JSON`);

    // Clear existing problems
    console.log('🗑️  Clearing existing problems...');
    await Problem.deleteMany({});
    console.log('✅ Cleared existing problems');

    // Insert new problems
    console.log('💾 Inserting problems into MongoDB...');
    const insertedProblems = await Problem.insertMany(problems);
    console.log(`✅ Successfully imported ${insertedProblems.length} problems!`);

    // Show statistics
    const stats = await Problem.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('\n📊 Statistics:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} problems`);
    });

    console.log('\n✨ Import complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

importProblems();
