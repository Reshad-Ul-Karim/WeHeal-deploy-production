import { User } from "../models/userModel.js";
import { DoctorAvailability } from "../models/doctorAvailabilityModel.js";
import { Appointment } from "../models/appointmentModel.js";

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

// Initialize doctor's availability for all days
const initializeDoctorAvailability = async (userId) => {
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const defaultSlots = generateTimeSlots();

  try {
    // Check for existing records first
    const existingRecords = await DoctorAvailability.find({ 
      $or: [
        { userId },
        { doctorId: userId }
      ]
    });
    console.log("Existing availability records:", existingRecords);

    // If there are existing records, update them to use both fields and add missing time slots
    if (existingRecords.length > 0) {
      await Promise.all(existingRecords.map(async (record) => {
        if (!record.doctorId) {
          record.doctorId = record.userId;
        } else if (!record.userId) {
          record.userId = record.doctorId;
        }
        
        // Check if we need to add the new time slots (00:00 to 7:50)
        const currentSlotCount = record.timeSlots.length;
        const expectedSlotCount = 24; // 00:00 to 23:50 = 24 slots
        
        if (currentSlotCount < expectedSlotCount) {
          console.log(`Updating ${record.dayOfWeek} availability to include all 24 time slots`);
          record.timeSlots = defaultSlots;
        }
        
        await record.save();
      }));
    }

    // Create availability entries for each day
    await Promise.all(
      daysOfWeek.map(async (day) => {
        console.log(`Creating availability for ${day} with userId:`, userId);
        return DoctorAvailability.create({
          userId,
          doctorId: userId, // Explicitly set both fields
          dayOfWeek: day,
          timeSlots: defaultSlots,
          isWorkingDay: day !== "Saturday" && day !== "Sunday", // Default weekends as non-working
        });
      })
    );
  } catch (error) {
    console.error("Error initializing doctor availability:", error);
    throw error;
  }
};

export const getDoctorDashboard = async (req, res) => {
  try {
    // Get doctor's profile
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    } 

    // Verify user is a doctor
    if (user.role !== "Doctor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Doctor privileges required.",
      });
    }

    console.log("Fetching availability for userId:", req.user._id);
    // Get doctor's availability
    let availability = await DoctorAvailability.find({ userId: req.user._id });
    console.log("Current availability:", availability);
    
    // If no availability exists, initialize it
    if (!availability || availability.length === 0) {
      console.log("No availability found, initializing...");
      await initializeDoctorAvailability(req.user._id);
      availability = await DoctorAvailability.find({ userId: req.user._id });
      console.log("Availability after initialization:", availability);
    }

    // Build both UTC and local day windows to avoid TZ mismatch
    const startUTC = new Date();
    startUTC.setUTCHours(0, 0, 0, 0);
    const endUTC = new Date(startUTC);
    endUTC.setUTCDate(endUTC.getUTCDate() + 1);

    const startLocal = new Date();
    startLocal.setHours(0, 0, 0, 0);
    const endLocal = new Date(startLocal);
    endLocal.setDate(endLocal.getDate() + 1);

    // Get today's appointments
    const todaysAppointments = await Appointment.find({
      doctorId: req.user._id,
      status: { $ne: "cancelled" },
      $or: [
        { appointmentDate: { $gte: startUTC, $lt: endUTC } },
        { appointmentDate: { $gte: startLocal, $lt: endLocal } },
      ],
    })
      .populate("patientId", "name")
      .sort({ startTime: 1 });
    console.log("todaysAppointments", todaysAppointments);
    // Get upcoming appointments (beyond today)
    const upcomingAppointments = await Appointment.find({
      doctorId: req.user._id,
      appointmentDate: { $gte: endUTC },
      status: { $ne: "cancelled" },
    })
      .populate("patientId", "name")
      .sort({ appointmentDate: 1, startTime: 1 });
    console.log("upcomingAppointments", upcomingAppointments);
    // Get all scheduled appointments beyond today
    const allScheduledAppointments = await Appointment.find({
      doctorId: req.user._id,
      appointmentDate: { $gte: startUTC },
      status: { $ne: "cancelled" },
    })
      .populate("patientId", "name")
      .sort({ appointmentDate: 1, startTime: 1 });
    console.log("allScheduledAppointments", allScheduledAppointments);
    // Format appointments for the frontend
    const formattedTodayAppointments = todaysAppointments.map((apt) => ({
      _id: apt._id,
      time: `${apt.startTime} - ${apt.endTime}`,
      patient: apt.patientId.name,
      patientId: apt.patientId._id, // Include patient ID for API calls
      type: apt.type === "in-person" ? "In-Person" : "Tele-Consult",
      status: apt.status
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    }));
    console.log("formattedTodayAppointments", formattedTodayAppointments);
    // Format all appointments for the frontend
    const formattedAllAppointments = allScheduledAppointments.map((apt) => ({
      _id: apt._id,
      date: new Date(apt.appointmentDate).toLocaleDateString(),
      time: `${apt.startTime} - ${apt.endTime}`,
      patient: apt.patientId.name,
      patientId: apt.patientId._id, // Include patient ID for API calls
      type: apt.type === "in-person" ? "In-Person" : "Tele-Consult",
      status: apt.status
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    }));
    console.log("formattedAllAppointments", formattedAllAppointments);
    // Get total patients (unique patients who have appointments)
    const totalPatients = await Appointment.distinct("patientId", {
      doctorId: req.user._id,
      status: { $ne: "cancelled" },
    }).count();
    console.log("totalPatients", totalPatients);
    // Get completed appointments count
    const completedAppointments = await Appointment.countDocuments({
      doctorId: req.user._id,
      status: "completed",
    });
    console.log("completedAppointments", completedAppointments);
    // Get waiting patients count
    const waitingPatients = await Appointment.countDocuments({
      doctorId: req.user._id,
      status: "scheduled",
      $or: [
        { appointmentDate: { $gte: startUTC, $lt: endUTC } },
        { appointmentDate: { $gte: startLocal, $lt: endLocal } },
      ],
    });
    console.log("waitingPatients", waitingPatients);
    // Get doctor dashboard data
    const dashboardData = {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      doctorData: {
        totalPatients,
        appointmentsToday: todaysAppointments.length,
        upcomingAppointments: upcomingAppointments.length,
        completedAppointments,
        schedule: formattedTodayAppointments,
        todaysAppointments: formattedTodayAppointments,
        allAppointments: formattedAllAppointments,
        patientQueue: {
          waiting: todaysAppointments.filter(
            (apt) => apt.status.toLowerCase() === "scheduled"
          ).length,
        },
        prescriptionsToday: {
          completed: 3, // Placeholder
        },
        messages: {
          unread: 2, // Placeholder
        },
        criticalActions: {
          labResults: 1, // Placeholder
          pendingReports: 2, // Placeholder
          urgentMessages: 1, // Placeholder
        },
      },
    };
    console.log("dashboardData", dashboardData);
    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error in getDoctorDashboard:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor dashboard data",
      error: error.message,
    });
  }
};

// Get appointment details by ID
export const getAppointmentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    // Find the appointment and populate patient details
    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name doctorDetails');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if the current user is the doctor for this appointment
    if (appointment.doctorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own appointments.'
      });
    }
    
    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error fetching appointment details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment details',
      error: error.message
    });
  }
};

// Get doctor's availability for a specific day
export const getDoctorAvailability = async (req, res) => {
  try {
    const { dayOfWeek } = req.params;

    // Validate day of week
    const validDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    if (!validDays.includes(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        message: "Invalid day of week",
      });
    }

    let availability = await DoctorAvailability.findOne({
      userId: req.user._id,
      dayOfWeek,
    });

    // If no availability exists, initialize all days and fetch the requested day
    if (!availability) {
      await initializeDoctorAvailability(req.user._id);
      availability = await DoctorAvailability.findOne({
        userId: req.user._id,
        dayOfWeek,
      });
    }

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error("Error in getDoctorAvailability:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor availability",
      error: error.message,
    });
  }
};

// Update doctor's availability for a specific day
export const updateDoctorAvailability = async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const { timeSlots, isWorkingDay } = req.body;

    // Validate day of week
    const validDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    if (!validDays.includes(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        message: "Invalid day of week",
      });
    }

    // Validate time slots format if provided
    if (timeSlots) {
      for (const slot of timeSlots) {
        if (!slot.startTime || !slot.endTime) {
          return res.status(400).json({
            success: false,
            message: "Invalid time slot format",
          });
        }
      }
    }

    const availability = await DoctorAvailability.findOneAndUpdate(
      {
        userId: req.user._id,
        dayOfWeek,
      },
      {
        $set: {
          timeSlots: timeSlots || generateTimeSlots(),
          isWorkingDay: isWorkingDay !== undefined ? isWorkingDay : true,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error("Error in updateDoctorAvailability:", error);
    res.status(500).json({
      success: false,
      message: "Error updating doctor availability",
      error: error.message,
    });
  }
};

// Get all doctor's availability
export const getAllDoctorAvailability = async (req, res) => {
  try {
    let availability = await DoctorAvailability.find({ userId: req.user._id });

    // If no availability exists, initialize it
    if (!availability || availability.length === 0) {
      await initializeDoctorAvailability(req.user._id);
      availability = await DoctorAvailability.find({ userId: req.user._id });
    }

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error("Error in getAllDoctorAvailability:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor availability",
      error: error.message,
    });
  }
};

// Get patient details and medical history
export const getPatientDetails = async (req, res) => {
  try {
    console.log('getPatientDetails called with patientId:', req.params.patientId);
    console.log('Request user:', req.user);
    
    const { patientId } = req.params;

    // Verify the patient exists and get their details
    const patient = await User.findById(patientId).select('-password');
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Verify the patient has a role of 'Patient'
    if (patient.role !== 'Patient') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID'
      });
    }

    // Get patient's appointment history with this doctor
    const appointments = await Appointment.find({
      doctorId: req.user._id,
      patientId: patientId
    }).sort({ appointmentDate: -1, createdAt: -1 });

    // Get patient's medical history from other doctors (optional - for comprehensive view)
    const allAppointments = await Appointment.find({
      patientId: patientId,
      status: 'completed'
    }).populate('doctorId', 'name doctorDetails.specialization')
    .sort({ appointmentDate: -1, createdAt: -1 });

    // Format the response
    const patientData = {
      _id: patient._id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      profilePicture: patient.profilePicture,
      patientDetails: patient.patientDetails || {},
      appointments: appointments.map(apt => ({
        _id: apt._id,
        appointmentDate: apt.appointmentDate,
        startTime: apt.startTime,
        endTime: apt.endTime,
        type: apt.type,
        status: apt.status,
        notes: apt.notes,
        consultationFee: apt.consultationFee,
        createdAt: apt.createdAt
      })),
      medicalHistory: allAppointments.map(apt => ({
        date: apt.appointmentDate,
        doctor: apt.doctorId.name,
        specialization: apt.doctorId.doctorDetails?.specialization || 'General',
        type: apt.type,
        notes: apt.notes
      }))
    };

    console.log('Patient data being sent:', patientData);

    res.json({
      success: true,
      data: patientData
    });

  } catch (error) {
    console.error("Error in getPatientDetails:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching patient details",
      error: error.message,
    });
  }
};

// Migrate existing doctor availability to include all 24 time slots
export const migrateDoctorAvailability = async (req, res) => {
  try {
    console.log("Starting migration of doctor availability to include all 24 time slots");
    
    // Get all existing doctor availability records
    const allAvailability = await DoctorAvailability.find({});
    console.log(`Found ${allAvailability.length} availability records to migrate`);
    
    let migratedCount = 0;
    const defaultSlots = generateTimeSlots();
    
    for (const record of allAvailability) {
      const currentSlotCount = record.timeSlots.length;
      const expectedSlotCount = 24; // 00:00 to 23:50 = 24 slots
      
      if (currentSlotCount < expectedSlotCount) {
        console.log(`Migrating ${record.dayOfWeek} for doctor ${record.userId} from ${currentSlotCount} to ${expectedSlotCount} slots`);
        record.timeSlots = defaultSlots;
        await record.save();
        migratedCount++;
      }
    }
    
    console.log(`Migration completed. ${migratedCount} records updated.`);
    
    res.json({
      success: true,
      message: `Migration completed successfully. ${migratedCount} availability records updated.`,
      migratedCount
    });
  } catch (error) {
    console.error("Error in migrateDoctorAvailability:", error);
    res.status(500).json({
      success: false,
      message: "Error migrating doctor availability",
      error: error.message,
    });
  }
};
