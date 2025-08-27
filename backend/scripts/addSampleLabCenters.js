import { connectDB } from '../db/connectDB.js';
import { LabCenter } from '../models/labCenterModel.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleLabCenters = [
  {
    name: 'Metro Diagnostic Center',
    address: {
      street: '123 Healthcare Avenue',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    },
    contactInfo: {
      phone: '+91-22-12345678',
      email: 'info@metrodiagnostic.com',
      website: 'https://metrodiagnostic.com'
    },
    operatingHours: {
      monday: { open: '08:00', close: '20:00' },
      tuesday: { open: '08:00', close: '20:00' },
      wednesday: { open: '08:00', close: '20:00' },
      thursday: { open: '08:00', close: '20:00' },
      friday: { open: '08:00', close: '20:00' },
      saturday: { open: '08:00', close: '18:00' },
      sunday: { open: '09:00', close: '16:00' }
    },
    facilities: ['blood-collection', 'urine-collection', 'imaging', 'pathology', 'radiology'],
    rating: 4.5,
    totalRatings: 125
  },
  {
    name: 'City Health Lab',
    address: {
      street: '456 Medical Plaza',
      city: 'Delhi',
      state: 'Delhi',
      zipCode: '110001',
      country: 'India'
    },
    contactInfo: {
      phone: '+91-11-98765432',
      email: 'contact@cityhealthlab.com',
      website: 'https://cityhealthlab.com'
    },
    operatingHours: {
      monday: { open: '07:00', close: '19:00' },
      tuesday: { open: '07:00', close: '19:00' },
      wednesday: { open: '07:00', close: '19:00' },
      thursday: { open: '07:00', close: '19:00' },
      friday: { open: '07:00', close: '19:00' },
      saturday: { open: '07:00', close: '17:00' },
      sunday: { open: '08:00', close: '15:00' }
    },
    facilities: ['blood-collection', 'urine-collection', 'cardiology', 'pathology'],
    rating: 4.2,
    totalRatings: 89
  },
  {
    name: 'Advanced Diagnostics',
    address: {
      street: '789 Health Street',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001',
      country: 'India'
    },
    contactInfo: {
      phone: '+91-80-55556666',
      email: 'info@advanceddiagnostics.com',
      website: 'https://advanceddiagnostics.com'
    },
    operatingHours: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '06:00', close: '20:00' },
      sunday: { open: '07:00', close: '18:00' }
    },
    facilities: ['blood-collection', 'urine-collection', 'imaging', 'cardiology', 'pathology', 'radiology'],
    rating: 4.8,
    totalRatings: 234
  },
  {
    name: 'Precision Lab Services',
    address: {
      street: '321 Science Park',
      city: 'Chennai',
      state: 'Tamil Nadu',
      zipCode: '600001',
      country: 'India'
    },
    contactInfo: {
      phone: '+91-44-77778888',
      email: 'contact@precisionlab.com',
      website: 'https://precisionlab.com'
    },
    operatingHours: {
      monday: { open: '08:30', close: '18:30' },
      tuesday: { open: '08:30', close: '18:30' },
      wednesday: { open: '08:30', close: '18:30' },
      thursday: { open: '08:30', close: '18:30' },
      friday: { open: '08:30', close: '18:30' },
      saturday: { open: '08:30', close: '16:30' },
      sunday: { open: '09:00', close: '14:00' }
    },
    facilities: ['blood-collection', 'urine-collection', 'pathology'],
    rating: 4.0,
    totalRatings: 67
  },
  {
    name: 'Elite Medical Center',
    address: {
      street: '654 Wellness Road',
      city: 'Hyderabad',
      state: 'Telangana',
      zipCode: '500001',
      country: 'India'
    },
    contactInfo: {
      phone: '+91-40-99990000',
      email: 'info@elitemedical.com',
      website: 'https://elitemedical.com'
    },
    operatingHours: {
      monday: { open: '07:30', close: '21:30' },
      tuesday: { open: '07:30', close: '21:30' },
      wednesday: { open: '07:30', close: '21:30' },
      thursday: { open: '07:30', close: '21:30' },
      friday: { open: '07:30', close: '21:30' },
      saturday: { open: '07:30', close: '19:30' },
      sunday: { open: '08:00', close: '17:00' }
    },
    facilities: ['blood-collection', 'urine-collection', 'imaging', 'cardiology', 'pathology', 'radiology'],
    rating: 4.6,
    totalRatings: 156
  }
];

async function addSampleLabCenters() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Successfully connected to MongoDB');

    // Clear existing lab centers
    await LabCenter.deleteMany({});
    console.log('🗑️ Cleared existing lab centers');

    // Insert sample lab centers
    const createdLabCenters = await LabCenter.insertMany(sampleLabCenters);
    console.log(`✅ Successfully created ${createdLabCenters.length} lab centers`);

    console.log('\n📋 Created Lab Centers:');
    createdLabCenters.forEach((labCenter, index) => {
      console.log(`${index + 1}. ${labCenter.name}`);
      console.log(`   📍 ${labCenter.address.city}, ${labCenter.address.state}`);
      console.log(`   📞 ${labCenter.contactInfo.phone}`);
      console.log(`   ⭐ Rating: ${labCenter.rating}/5 (${labCenter.totalRatings} ratings)`);
      console.log(`   🏥 Facilities: ${labCenter.facilities.join(', ')}`);
      console.log('');
    });

    console.log('🎉 Sample lab centers added successfully!');
    console.log('\n💡 You can now use these lab centers when creating lab test pricing.');

  } catch (error) {
    console.error('❌ Error adding sample lab centers:', error.message);
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
}

addSampleLabCenters();
