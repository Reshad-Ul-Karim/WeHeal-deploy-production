import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/userModel.js';
import connectDB from '../db/connectDB.js';

dotenv.config();

const agents = [
  { name: 'Agent One', email: 'agent1@weheal.com', phone: '1000000001' },
  { name: 'Agent Two', email: 'agent2@weheal.com', phone: '1000000002' },
  { name: 'Agent Three', email: 'agent3@weheal.com', phone: '1000000003' },
  { name: 'Agent Four', email: 'agent4@weheal.com', phone: '1000000004' },
  { name: 'Agent Five', email: 'agent5@weheal.com', phone: '1000000005' },
];

async function run() {
  try {
    await connectDB();
    const passwordHash = await bcrypt.hash('WeHeal!123', 10);

    for (const a of agents) {
      const existing = await User.findOne({ email: a.email });
      if (existing) {
        console.log(`Exists: ${a.email}`);
        continue;
      }
      await User.create({
        name: a.name,
        email: a.email,
        phone: a.phone,
        role: 'CustomerCare',
        password: passwordHash,
        isVerified: true,
      });
      console.log(`Created: ${a.email}`);
    }

    console.log('Done. Default password for all agents: WeHeal!123');
    await mongoose.connection.close();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();


