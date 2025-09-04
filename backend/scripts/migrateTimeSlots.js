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

const migrateTimeSlots = async () => {
  try {
    console.log('Starting migration of doctor availability to include all 24 time slots...');
    
    // Connect to database
    await connectDB();
    console.log('Connected to database');
    
    // Get all existing doctor availability records
    const allAvailability = await DoctorAvailability.find({});
    console.log(`Found ${allAvailability.length} availability records to migrate`);
    
    if (allAvailability.length === 0) {
      console.log('No availability records found. Migration not needed.');
      process.exit(0);
    }
    
    let migratedCount = 0;
    const defaultSlots = generateTimeSlots();
    
    for (const record of allAvailability) {
      const currentSlotCount = record.timeSlots.length;
      const expectedSlotCount = 24; // 00:00 to 23:50 = 24 slots
      
      if (currentSlotCount < expectedSlotCount) {
        console.log(`Migrating ${record.dayOfWeek} for doctor ${record.userId} from ${currentSlotCount} to ${expectedSlotCount} slots`);
        
        // Preserve existing slot availability status if possible
        const updatedSlots = defaultSlots.map(newSlot => {
          const existingSlot = record.timeSlots.find(existing => 
            existing.startTime === newSlot.startTime && existing.endTime === newSlot.endTime
          );
          
          if (existingSlot) {
            return {
              ...newSlot,
              isAvailable: existingSlot.isAvailable,
              appointment: existingSlot.appointment || null
            };
          }
          
          return newSlot;
        });
        
        record.timeSlots = updatedSlots;
        await record.save();
        migratedCount++;
      } else {
        console.log(`Skipping ${record.dayOfWeek} for doctor ${record.userId} - already has ${currentSlotCount} slots`);
      }
    }
    
    console.log(`Migration completed successfully! ${migratedCount} availability records updated.`);
    console.log('All doctors now have 24 time slots from 00:00 to 23:50');
    
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
    process.exit(0);
  }
};

// Run the migration
migrateTimeSlots();
