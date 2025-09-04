import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema({
  // Unique identifier for the request
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  // ID of the patient who created the request
  patientId: {
    type: String,
    required: true
  },
  // ID of the driver who accepted the request (if any)
  driverId: {
    type: String
  },
  // Patient information
  patientInfo: {
    name: String,
    phone: String,
    email: String
  },
  // Driver information (when assigned)
  driverInfo: {
    id: String,
    name: String,
    phone: String,
    vehicleType: String,
    vehicleNumber: String,
    location: String
  },
  // Location information
  location: {
    type: String,
    required: true
  },
  // Additional location coordinates (optional)
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  // Real-time location tracking
  patientLocation: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date,
    address: String
  },
  driverLocation: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date,
    heading: Number, // Direction in degrees
    speed: Number    // Speed in km/h
  },
  // Location sharing permissions
  locationPermissions: {
    patientSharing: {
      type: Boolean,
      default: false
    },
    driverSharing: {
      type: Boolean,
      default: false
    },
    requestedAt: Date,
    grantedAt: Date
  },
  // Location update history
  locationHistory: [{
    userId: String,
    userType: {
      type: String,
      enum: ['patient', 'driver']
    },
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Type of emergency
  emergencyType: {
    type: String,
    default: 'cardiac'
  },
  // Description of the emergency
  description: String,
  // Current status of the request
  status: {
    type: String,
    enum: [
      'pending',
      'accepted',
      'started_journey',
      'on_the_way',
      'almost_there',
      'looking_for_patient',
      'received_patient',
      'dropping_off',
      'completed',
      'cancelled'
    ],
    default: 'pending'
  },
  // Timestamps for status changes
  statusHistory: {
    pending: Date,
    accepted: Date,
    started_journey: Date,
    on_the_way: Date,
    almost_there: Date,
    looking_for_patient: Date,
    received_patient: Date,
    dropping_off: Date,
    completed: Date,
    cancelled: Date
  },
  // Ride Details - Comprehensive ride information
  rideDetails: {
    // Pickup location
    pickup: {
      address: String,
      latitude: Number,
      longitude: Number,
      coordinates: [Number, Number], // [longitude, latitude] for GeoJSON
      landmark: String,
      instructions: String
    },
    // Destination location
    destination: {
      address: String,
      latitude: Number,
      longitude: Number,
      coordinates: [Number, Number], // [longitude, latitude] for GeoJSON
      landmark: String,
      instructions: String,
      hospitalName: String,
      department: String
    },
    // Route information
    route: {
      distance: {
        total: Number, // Total distance in kilometers
        remaining: Number // Remaining distance in kilometers
      },
      duration: {
        estimated: Number, // Estimated duration in minutes
        actual: Number, // Actual duration in minutes
        remaining: Number // Remaining time in minutes
      },
      polyline: String, // Google Maps polyline for route visualization
      waypoints: [{
        latitude: Number,
        longitude: Number,
        address: String,
        timestamp: Date
      }]
    },
    // Timing information
    timing: {
      requestTime: Date, // When request was made
      acceptedTime: Date, // When driver accepted
      pickupTime: Date, // When driver picked up patient
      dropoffTime: Date, // When patient was dropped off
      estimatedPickupTime: Date, // Estimated pickup time
      estimatedDropoffTime: Date, // Estimated dropoff time
      actualPickupTime: Date, // Actual pickup time
      actualDropoffTime: Date // Actual dropoff time
    },
    // Ride metrics
    metrics: {
      totalDistance: Number, // Total distance traveled in km
      totalDuration: Number, // Total duration in minutes
      averageSpeed: Number, // Average speed in km/h
      maxSpeed: Number, // Maximum speed reached in km/h
      stops: Number, // Number of stops made
      waitTime: Number // Total wait time in minutes
    },
    // Fare calculation
    fare: {
      baseFare: Number, // Base fare amount
      distanceFare: Number, // Distance-based fare
      timeFare: Number, // Time-based fare
      emergencySurcharge: Number, // Emergency service surcharge
      totalFare: Number, // Total fare amount
      currency: {
        type: String,
        default: 'BDT'
      }
    },
    // Ride status tracking
    rideStatus: {
      isStarted: {
        type: Boolean,
        default: false
      },
      isCompleted: {
        type: Boolean,
        default: false
      },
      isCancelled: {
        type: Boolean,
        default: false
      },
      cancellationReason: String,
      cancellationTime: Date
    }
  },
  // Payment information
  payment: {
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'insurance', ''],
      default: ''
    },
    amount: {
      type: Number,
      default: 0
    },
    paidAt: Date
  }
}, { timestamps: true });

const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);

export default EmergencyRequest; 