import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/userModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const createMultipleCustomerCareOfficers = async () => {
  try {
    // Connect to cloud database from .env file
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/weHeal';
    console.log('Connecting to:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('Connected to database');

    const officers = [
      {
        name: 'General Support Agent',
        userId: 'agent1',
        password: 'WeHeal!123',
        department: 'general'
      },
      {
        name: 'Technical Support Agent',
        userId: 'agent2',
        password: 'WeHeal!123',
        department: 'technical'
      },
      {
        name: 'Billing Support Agent',
        userId: 'agent3',
        password: 'WeHeal!123',
        department: 'billing'
      },
      {
        name: 'Emergency Support Agent',
        userId: 'agent4',
        password: 'WeHeal!123',
        department: 'emergency'
      },
      {
        name: 'Senior Support Agent',
        userId: 'agent5',
        password: 'WeHeal!123',
        department: 'general'
      }
    ];

    for (const officer of officers) {
      // Check if officer already exists
      const existingOfficer = await User.findOne({ 
        email: `${officer.userId}@weheal.local`,
        role: 'CustomerCare'
      });

      if (existingOfficer) {
        console.log(`Officer ${officer.userId} already exists:`, existingOfficer.email);
        continue;
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(officer.password, 12);

      // Create customer care officer
      const customerCareOfficer = new User({
        name: officer.name,
        email: `${officer.userId}@weheal.local`,
        password: hashedPassword,
        phone: '+1234567890',
        role: 'CustomerCare',
        isVerified: true,
        customerCareDetails: {
          department: officer.department,
          shift: 'morning',
          isAvailable: true,
          maxConcurrentChats: 3,
          currentChats: 0
        }
      });

      await customerCareOfficer.save();
      console.log(`✓ Created officer: ${officer.name} (${officer.userId})`);
    }

    console.log('\n=== Customer Care Officers Created ===');
    console.log('All officers use password: WeHeal!123');
    console.log('Login credentials:');
    officers.forEach(officer => {
      console.log(`- ${officer.userId} (${officer.department} support)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating customer care officers:', error);
    process.exit(1);
  }
};

createMultipleCustomerCareOfficers();
