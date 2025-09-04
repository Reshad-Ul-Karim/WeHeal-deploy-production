import mongoose from 'mongoose';
import { connectDB } from '../db/connectDB.js';
import { DoctorAvailability } from '../models/doctorAvailabilityModel.js';
import { User } from '../models/userModel.js';

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

const createSampleDoctorAvailability = async () => {
  try {
    console.log('Creating sample doctor availability with 24-hour time slots...');
    
    // Connect to database
    await connectDB();
    console.log('Connected to database');
    
    // Find a doctor user
    const doctor = await User.findOne({ role: 'Doctor' });
    if (!doctor) {
      console.log('No doctor found in database. Please create a doctor user first.');
      process.exit(1);
    }
    
    console.log(`Found doctor: ${doctor.name} (${doctor._id})`);
    
    // Check if availability already exists
    const existingAvailability = await DoctorAvailability.find({ userId: doctor._id });
    if (existingAvailability.length > 0) {
      console.log(`Doctor already has ${existingAvailability.length} availability records`);
      
      // Update existing records to use new time slots
      const defaultSlots = generateTimeSlots();
      let updatedCount = 0;
      
      for (const record of existingAvailability) {
        if (record.timeSlots.length < 24) {
          console.log(`Updating ${record.dayOfWeek} from ${record.timeSlots.length} to 24 slots`);
          record.timeSlots = defaultSlots;
          await record.save();
          updatedCount++;
        }
      }
      
      if (updatedCount > 0) {
        console.log(`Updated ${updatedCount} availability records`);
      } else {
        console.log('All records already have 24 time slots');
      }
    } else {
      // Create new availability records
      const daysOfWeek = [
        "Monday", "Tuesday", "Wednesday", "Thursday", 
        "Friday", "Saturday", "Sunday"
      ];
      const defaultSlots = generateTimeSlots();
      
      console.log('Creating new availability records for all days...');
      
      for (const day of daysOfWeek) {
        const availability = new DoctorAvailability({
          userId: doctor._id,
          doctorId: doctor._id,
          dayOfWeek: day,
          timeSlots: defaultSlots,
          isWorkingDay: day !== "Saturday" && day !== "Sunday"
        });
        
        await availability.save();
        console.log(`Created availability for ${day} with ${defaultSlots.length} time slots`);
      }
    }
    
    // Verify the records
    const finalAvailability = await DoctorAvailability.find({ userId: doctor._id });
    console.log(`\nFinal availability records: ${finalAvailability.length}`);
    
    finalAvailability.forEach(record => {
      console.log(`${record.dayOfWeek}: ${record.timeSlots.length} slots`);
      if (record.timeSlots.length > 0) {
        console.log(`  First: ${record.timeSlots[0].startTime} - ${record.timeSlots[0].endTime}`);
        console.log(`  Last: ${record.timeSlots[record.timeSlots.length - 1].startTime} - ${record.timeSlots[record.timeSlots.length - 1].endTime}`);
      }
    });
    
    console.log('\n✅ Sample doctor availability created/updated successfully!');
    
  } catch (error) {
    console.error('Error creating sample doctor availability:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
    process.exit(0);
  }
};

// Run the script
createSampleDoctorAvailability();
