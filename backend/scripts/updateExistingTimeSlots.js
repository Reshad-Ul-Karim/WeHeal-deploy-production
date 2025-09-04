import mongoose from 'mongoose';

// Connect directly to the cloud database
const connectToCloudDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/weHeal?retryWrites=true&w=majority&appName=sammam');
    console.log('Connected to cloud database');
    return true;
  } catch (error) {
    console.error('Failed to connect to cloud database:', error.message);
    return false;
  }
};

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

const updateExistingTimeSlots = async () => {
  try {
    console.log('Updating existing doctor availability records to include all 24 time slots...');
    
    // Connect to cloud database
    const connected = await connectToCloudDB();
    if (!connected) {
      process.exit(1);
    }
    
    // Get all existing doctor availability records using the raw collection
    const collection = mongoose.connection.db.collection('doctoravailabilities');
    const allAvailability = await collection.find({}).toArray();
    console.log(`Found ${allAvailability.length} availability records to update`);
    
    if (allAvailability.length === 0) {
      console.log('No availability records found. Nothing to update.');
      process.exit(0);
    }
    
    let updatedCount = 0;
    const defaultSlots = generateTimeSlots();
    
    for (const record of allAvailability) {
      const currentSlotCount = record.timeSlots ? record.timeSlots.length : 0;
      const expectedSlotCount = 24; // 00:00 to 23:50 = 24 slots
      
      if (currentSlotCount < expectedSlotCount) {
        console.log(`Updating ${record.dayOfWeek} for doctor ${record.userId} from ${currentSlotCount} to ${expectedSlotCount} slots`);
        
        // Preserve existing slot availability status and appointments if possible
        const updatedSlots = defaultSlots.map(newSlot => {
          const existingSlot = record.timeSlots ? record.timeSlots.find(existing => 
            existing.startTime === newSlot.startTime && existing.endTime === newSlot.endTime
          ) : null;
          
          if (existingSlot) {
            return {
              ...newSlot,
              isAvailable: existingSlot.isAvailable,
              appointment: existingSlot.appointment || null
            };
          }
          
          return newSlot;
        });
        
        // Update the record
        await collection.updateOne(
          { _id: record._id },
          { $set: { timeSlots: updatedSlots } }
        );
        
        updatedCount++;
      } else {
        console.log(`Skipping ${record.dayOfWeek} for doctor ${record.userId} - already has ${currentSlotCount} slots`);
      }
    }
    
    console.log(`\n✅ Update completed successfully! ${updatedCount} availability records updated.`);
    console.log('All doctors now have 24 time slots from 00:00 to 23:50');
    
    // Verify the update
    const finalAvailability = await collection.find({}).toArray();
    console.log(`\nFinal verification: ${finalAvailability.length} total records`);
    
    finalAvailability.forEach(record => {
      console.log(`${record.dayOfWeek}: ${record.timeSlots ? record.timeSlots.length : 0} slots`);
      if (record.timeSlots && record.timeSlots.length > 0) {
        console.log(`  First: ${record.timeSlots[0].startTime} - ${record.timeSlots[0].endTime}`);
        console.log(`  Last: ${record.timeSlots[record.timeSlots.length - 1].startTime} - ${record.timeSlots[record.timeSlots.length - 1].endTime}`);
      }
    });
    
  } catch (error) {
    console.error('Error during update:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
    process.exit(0);
  }
};

// Run the update
updateExistingTimeSlots();
