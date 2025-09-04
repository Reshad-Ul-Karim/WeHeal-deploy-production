import mongoose from 'mongoose';
import { connectDB } from '../db/connectDB.js';
import { DoctorAvailability } from '../models/doctorAvailabilityModel.js';
import { User } from '../models/userModel.js';

const setSampleAvailableSlots = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Get all doctors
    const doctors = await User.find({ role: 'Doctor' });
    console.log(`Found ${doctors.length} doctors`);

    if (doctors.length === 0) {
      console.log('No doctors found. Please create some doctors first.');
      return;
    }

    // Define some reasonable working hours (9 AM to 5 PM)
    const workingHours = [
      '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
    ];

    let updatedCount = 0;

    for (const doctor of doctors) {
      console.log(`\nUpdating availability for doctor: ${doctor.name} (${doctor._id})`);

      // Get doctor's availability for weekdays
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      
      for (const day of weekdays) {
        const availability = await DoctorAvailability.findOne({
          userId: doctor._id,
          dayOfWeek: day
        });

        if (availability) {
          // Update time slots to make working hours available
          availability.timeSlots = availability.timeSlots.map(slot => {
            const isWorkingHour = workingHours.includes(slot.startTime);
            return {
              ...slot,
              isAvailable: isWorkingHour
            };
          });

          // Ensure it's a working day
          availability.isWorkingDay = true;

          await availability.save();
          console.log(`  ✅ Updated ${day} - ${workingHours.length} slots available`);
          updatedCount++;
        } else {
          console.log(`  ⚠️  No availability record found for ${day}`);
        }
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} availability records`);
    console.log('Doctors now have available slots from 9:00 AM to 4:00 PM on weekdays');

  } catch (error) {
    console.error('Error setting sample available slots:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
setSampleAvailableSlots();
