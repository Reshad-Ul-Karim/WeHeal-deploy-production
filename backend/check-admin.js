import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "./db/connectDB.js";
import { User } from "./models/userModel.js";

dotenv.config();

async function checkUserRole() {
  try {
    await connectDB();
    
    // Check the specific user
    const userId = "6894858243e922cdc6efb282";
    const user = await User.findById(userId);
    console.log("Current user:", user);
    
    // Get all users to see who is admin
    const allUsers = await User.find({}, 'fullName email role');
    console.log("\nAll users in database:");
    allUsers.forEach(user => {
      console.log(`ID: ${user._id}, Name: ${user.fullName}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Update user to be admin if needed
    if (user && user.role !== 'Admin') {
      console.log(`\nUpdating user ${user.fullName} to Admin role...`);
      await User.findByIdAndUpdate(userId, { role: 'Admin' });
      console.log("User role updated to Admin");
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserRole();
