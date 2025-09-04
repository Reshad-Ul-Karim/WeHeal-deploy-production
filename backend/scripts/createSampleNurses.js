import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import { connectDB } from '../db/connectDB.js';
import { User } from '../models/userModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const createSampleNurses = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    const nurses = [
      {
        name: 'Sarah Johnson',
        userId: 'nurse1',
        password: 'WeHeal!123',
        specialization: 'Emergency',
        yearsOfExperience: 5,
        shift: 'morning'
      },
      {
        name: 'Michael Chen',
        userId: 'nurse2',
        password: 'WeHeal!123',
        specialization: 'ICU',
        yearsOfExperience: 8,
        shift: 'afternoon'
      },
      {
        name: 'Emily Rodriguez',
        userId: 'nurse3',
        password: 'WeHeal!123',
        specialization: 'General',
        yearsOfExperience: 3,
        shift: 'night'
      },
      {
        name: 'David Thompson',
        userId: 'nurse4',
        password: 'WeHeal!123',
        specialization: 'Pediatric',
        yearsOfExperience: 6,
        shift: 'morning'
      },
      {
        name: 'Lisa Wang',
        userId: 'nurse5',
        password: 'WeHeal!123',
        specialization: 'Surgical',
        yearsOfExperience: 10,
        shift: 'afternoon'
      }
    ];

    let createdCount = 0;
    let existingCount = 0;

    for (const nurse of nurses) {
      // Check if nurse already exists
      const existingNurse = await User.findOne({ 
        email: `${nurse.userId}@weheal.local`,
        role: 'Nurse'
      });

      if (existingNurse) {
        console.log(`Nurse ${nurse.userId} already exists:`, existingNurse.email);
        existingCount++;
        continue;
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(nurse.password, 12);

      // Create nurse
      const newNurse = new User({
        name: nurse.name,
        email: `${nurse.userId}@weheal.local`,
        password: hashedPassword,
        phone: '+1234567890',
        role: 'Nurse',
        isVerified: true,
        nurseDetails: {
          specialization: nurse.specialization,
          yearsOfExperience: nurse.yearsOfExperience,
          isAvailable: true,
          currentStatus: 'available',
          shift: nurse.shift,
          education: [
            {
              degree: 'Bachelor of Science in Nursing',
              institution: 'University of Health Sciences',
              year: 2020
            }
          ],
          certifications: [
            'Basic Life Support (BLS)',
            'Advanced Cardiac Life Support (ACLS)',
            'Pediatric Advanced Life Support (PALS)'
          ]
        }
      });

      await newNurse.save();
      console.log(`✓ Created nurse: ${nurse.name} (${nurse.userId}) - ${nurse.specialization}`);
      createdCount++;
    }

    console.log('\n=== Sample Nurses Created ===');
    console.log(`Created: ${createdCount} nurses`);
    console.log(`Already existed: ${existingCount} nurses`);
    console.log('All nurses use password: WeHeal!123');
    console.log('\nLogin credentials:');
    nurses.forEach(nurse => {
      console.log(`- ${nurse.userId}@weheal.local (${nurse.specialization} nurse)`);
    });

  } catch (error) {
    console.error('Error creating sample nurses:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
createSampleNurses();
