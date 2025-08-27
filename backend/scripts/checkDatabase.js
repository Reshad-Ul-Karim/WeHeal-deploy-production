import { connectDB } from '../db/connectDB.js';
import { User } from '../models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const checkDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Successfully connected to MongoDB');

    // Check all users in the database
    const users = await User.find({}, 'name email role isVerified createdAt');
    console.log(`\n📊 Found ${users.length} users in database:`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('💡 Run the createTestUser.js script to create test users');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Verified: ${user.isVerified ? '✅ Yes' : '❌ No'}`);
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    // Check specific test users
    const testUser = await User.findOne({ email: 'test@example.com' });
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    const abrarUser = await User.findOne({ email: 'abrar.samin@g.bracu.ac.bd' });

    console.log('🔍 Checking specific users:');
    
    if (testUser) {
      console.log('✅ Test user (test@example.com) exists');
      console.log(`   Verified: ${testUser.isVerified ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Test user (test@example.com) not found');
    }

    if (adminUser) {
      console.log('✅ Admin user (admin@example.com) exists');
      console.log(`   Verified: ${adminUser.isVerified ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Admin user (admin@example.com) not found');
    }

    if (abrarUser) {
      console.log('✅ Abrar user (abrar.samin@g.bracu.ac.bd) exists');
      console.log(`   Role: ${abrarUser.role}`);
      console.log(`   Verified: ${abrarUser.isVerified ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Abrar user (abrar.samin@g.bracu.ac.bd) not found');
    }

    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. If no users exist, run: node scripts/createTestUser.js');
    console.log('2. If users exist but login fails, check:');
    console.log('   - Backend server is running (npm start in backend directory)');
    console.log('   - Frontend is running (npm start in frontend directory)');
    console.log('   - Database connection (check .env file)');
    console.log('   - User verification status (should be true for testing)');

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    console.log('\n🔧 Common issues:');
    console.log('1. MongoDB not running');
    console.log('2. Wrong connection string in .env file');
    console.log('3. Network connectivity issues');
  } finally {
    try {
      await connectDB().then(() => {
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
      });
    } catch (error) {
      console.log('Error disconnecting:', error.message);
      process.exit(1);
    }
  }
};

checkDatabase();
