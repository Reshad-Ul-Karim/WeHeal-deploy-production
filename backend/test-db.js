import mongoose from 'mongoose';
import { User } from './models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function testDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully!');
    
    console.log('\nChecking for Customer Care Officers...');
    const customerCareUsers = await User.find({ role: 'CustomerCare' }).select('_id name email userId phone');
    console.log('Customer Care Officers found:', customerCareUsers.length);
    customerCareUsers.forEach(user => {
      console.log(`- ID: ${user._id}, Name: ${user.name}, Email: ${user.email}, UserID: ${user.userId}, Phone: ${user.phone}`);
    });
    
    console.log('\nChecking for Patients...');
    const patients = await User.find({ role: 'Patient' }).select('_id name email phone').limit(3);
    console.log('Sample Patients:', patients);
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

testDB();
