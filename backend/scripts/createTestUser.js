import { connectDB } from '../db/connectDB.js';
import { User } from '../models/userModel.js';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const createTestUser = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Test user credentials
    const testUser = {
      name: 'Test Patient',
      email: 'test@example.com',
      password: 'password123',
      phone: '1234567890',
      role: 'Patient',
      isVerified: true // Skip email verification for testing
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: testUser.email });
    if (existingUser) {
      console.log('Test user already exists:');
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      console.log('Is Verified:', existingUser.isVerified);
      console.log('Password:', testUser.password); // Show the plain text password for testing
      return;
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(testUser.password, 10);

    // Create user
    const user = new User({
      name: testUser.name,
      email: testUser.email,
      password: hashedPassword,
      phone: testUser.phone,
      role: testUser.role,
      isVerified: testUser.isVerified
    });

    await user.save();
    console.log('Test user created successfully:');
    console.log('Email:', testUser.email);
    console.log('Password:', testUser.password);
    console.log('Role:', testUser.role);
    console.log('Is Verified:', testUser.isVerified);

    // Also create a test admin user
    const testAdmin = {
      name: 'Test Admin',
      email: 'admin@example.com',
      password: 'admin123',
      phone: '0987654321',
      role: 'Admin',
      isVerified: true
    };

    const existingAdmin = await User.findOne({ email: testAdmin.email });
    if (!existingAdmin) {
      const hashedAdminPassword = await bcryptjs.hash(testAdmin.password, 10);
      const adminUser = new User({
        name: testAdmin.name,
        email: testAdmin.email,
        password: hashedAdminPassword,
        phone: testAdmin.phone,
        role: testAdmin.role,
        isVerified: testAdmin.isVerified
      });

      await adminUser.save();
      console.log('\nTest admin user created successfully:');
      console.log('Email:', testAdmin.email);
      console.log('Password:', testAdmin.password);
      console.log('Role:', testAdmin.role);
    } else {
      console.log('\nTest admin user already exists:');
      console.log('Email:', existingAdmin.email);
      console.log('Password:', testAdmin.password);
      console.log('Role:', existingAdmin.role);
    }

    console.log('\n=== LOGIN TESTING INSTRUCTIONS ===');
    console.log('1. Start your backend server: npm start (in backend directory)');
    console.log('2. Start your frontend: npm start (in frontend directory)');
    console.log('3. Go to the login page');
    console.log('4. Use these credentials:');
    console.log('   Email: test@example.com');
    console.log('   Password: password123');
    console.log('   OR');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await connectDB().then(() => {
      console.log('Disconnected from MongoDB');
      process.exit(0);
    });
  }
};

createTestUser();
