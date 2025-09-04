import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/userModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const createCustomerCareOfficer = async () => {
  try {
    // Connect to cloud database from .env file
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/weHeal';
    console.log('Connecting to:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('Connected to database');

    // Check if customer care officer already exists
    const existingOfficer = await User.findOne({ 
      email: 'agent1@weheal.local',
      role: 'CustomerCare'
    });

    if (existingOfficer) {
      console.log('Customer care officer already exists:', existingOfficer.email);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash('WeHeal!123', 12);

    // Create customer care officer
    const customerCareOfficer = new User({
      name: 'Test Customer Care Agent',
      email: 'agent1@weheal.local',
      password: hashedPassword,
      phone: '+1234567890', // Add required phone field
      role: 'CustomerCare',
      isVerified: true,
      customerCareDetails: {
        department: 'general',
        shift: 'morning',
        isAvailable: true,
        maxConcurrentChats: 3,
        currentChats: 0
      }
    });

    await customerCareOfficer.save();
    console.log('Customer care officer created successfully:');
    console.log('Email: agent1@weheal.local');
    console.log('Password: WeHeal!123');
    console.log('User ID: agent1');
    console.log('Role: CustomerCare');

    process.exit(0);
  } catch (error) {
    console.error('Error creating customer care officer:', error);
    process.exit(1);
  }
};

createCustomerCareOfficer();
