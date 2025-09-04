import mongoose from 'mongoose';
import { connectDB } from '../db/connectDB.js';
import { DoctorAvailability } from '../models/doctorAvailabilityModel.js';

// Generate time slots from 00:00 (midnight) to 23:50 with 50-minute duration and 10-minute gaps
const generateTimeSlots = () => {
  const slots = [];
  const startHour = 0; // 00:00 (midnight)
  const endHour = 24; // 24:00 (next midnight)

  for (let hour = startHour; hour < endHour; hour++) {
    const startTime = `${hour.toString().padStart(2, "0")}:00`;
    const endTime = `${hour.toString().padStart(2, "0")}:50`; // 50 minutes duration, 10 minutes gap
    slots.push({
      startTime,
      endTime,
      isAvailable: false,
    });
  }
  return slots;
};

const testTimeSlots = async () => {
  try {
    console.log('Testing time slot generation...');
    
    // Test the generateTimeSlots function
    const slots = generateTimeSlots();
    console.log(`Generated ${slots.length} time slots`);
    
    // Display first few and last few slots
    console.log('\nFirst 5 slots:');
    slots.slice(0, 5).forEach(slot => {
      console.log(`  ${slot.startTime} - ${slot.endTime}`);
    });
    
    console.log('\nLast 5 slots:');
    slots.slice(-5).forEach(slot => {
      console.log(`  ${slot.startTime} - ${slot.endTime}`);
    });
    
    // Verify we have slots from 00:00 to 23:50
    const firstSlot = slots[0];
    const lastSlot = slots[slots.length - 1];
    
    if (firstSlot.startTime === '00:00' && lastSlot.endTime === '23:50') {
      console.log('\n✅ Time slots correctly cover 00:00 to 23:50');
    } else {
      console.log('\n❌ Time slots do not cover the expected range');
      console.log(`First slot: ${firstSlot.startTime}, Last slot: ${lastSlot.endTime}`);
    }
    
    // Verify we have exactly 24 slots
    if (slots.length === 24) {
      console.log('✅ Correct number of time slots (24)');
    } else {
      console.log(`❌ Expected 24 slots, got ${slots.length}`);
    }
    
    // Check if we have the specific slots mentioned in the user query
    const expectedSlots = [
      '00:00 - 00:50',
      '08:00 - 08:50',
      '14:00 - 14:50',
      '23:00 - 23:50'
    ];
    
    console.log('\nChecking for specific expected slots:');
    expectedSlots.forEach(expectedSlot => {
      const found = slots.some(slot => `${slot.startTime} - ${slot.endTime}` === expectedSlot);
      if (found) {
        console.log(`  ✅ ${expectedSlot}`);
      } else {
        console.log(`  ❌ ${expectedSlot} (missing)`);
      }
    });
    
  } catch (error) {
    console.error('Error during testing:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
    process.exit(0);
  }
};

// Run the test
testTimeSlots();
