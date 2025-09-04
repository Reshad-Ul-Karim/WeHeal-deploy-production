// models/User.js
import mongoose from "mongoose";
import { MEDICAL_SPECIALIZATIONS } from '../constants/specializations.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    profilePicture: { type: String, default: '' },
    lastLogin: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    verificationToken: { type: String },
    verificationExpires: { type: Date },
    role: {
      type: String,
      enum: ["Patient", "Doctor", "ClinicStaff", "Admin", "Nurse", "Driver", "CustomerCare"],
      required: true,
      default: "Patient",
    },
    password: { type: String, required: true },
    patientDetails: {
      DOB: Date,
      age: Number,
      weight: Number,
      height: Number,
      address: String,
      profilePicture: String,
      bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
      },
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String
      },
      medicalHistory: [String],
      allergies: [String],
      currentMedications: [String],
      insuranceDetails: mongoose.Schema.Types.Mixed,
    },
    doctorDetails: {
      specialization: {
        type: String,
        enum: MEDICAL_SPECIALIZATIONS,
        required: function() { return this.role === 'Doctor'; }
      },
      yearsOfExperience: {
        type: Number,
        min: 0,
        max: 50,
        required: function() { return this.role === 'Doctor'; }
      },
      education: [{
        degree: String,
        institution: String,
        year: Number
      }],
      availabilitySchedule: [String],
      consultationFee: {
        type: Number,
        min: 0,
        required: function() { return this.role === 'Doctor'; }
      },
      bio: {
        type: String,
        maxLength: 500
      },
      languages: [{
        type: String,
        enum: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Hindi', 'Arabic', 'Russian', 'Japanese', 'Korean','Bangla']
      }]
    },
    driverDetails: {
      vehicleType: {
        type: String,
        enum: ['standard', 'advanced', 'specialized', 'helicopter'],
        required: function() { return this.role === 'Driver'; }
      },
      vehicleNumber: {
        type: String,
        required: function() { return this.role === 'Driver'; }
      },
      licenseNumber: String,
      yearsOfExperience: Number,
      isAvailable: {
        type: Boolean,
        default: true
      },
      location: String,
      currentStatus: {
        type: String,
        enum: ['available', 'on_duty', 'offline'],
        default: 'available'
      }
    },
    clinicStaffDetails: {
      clinicLocation: String,
    },
    nurseDetails: {
      specialization: {
        type: String,
        enum: ['General', 'ICU', 'Emergency', 'Pediatric', 'Surgical', 'Cardiac', 'Oncology', 'Psychiatric', 'Other'],
        default: 'General'
      },
      yearsOfExperience: {
        type: Number,
        min: 0,
        max: 50,
        default: 0
      },
      education: [{
        degree: String,
        institution: String,
        year: Number
      }],
      certifications: [String],
      isAvailable: {
        type: Boolean,
        default: true
      },
      currentStatus: {
        type: String,
        enum: ['available', 'on_duty', 'offline'],
        default: 'available'
      },
      shift: {
        type: String,
        enum: ['morning', 'afternoon', 'night'],
        default: 'morning'
      }
    },
    customerCareDetails: {
      department: {
        type: String,
        enum: ['general', 'technical', 'billing', 'emergency'],
        default: 'general'
      },
      shift: {
        type: String,
        enum: ['morning', 'afternoon', 'night'],
        default: 'morning'
      },
      isAvailable: {
        type: Boolean,
        default: true
      },
      maxConcurrentChats: {
        type: Number,
        default: 3
      },
      currentChats: {
        type: Number,
        default: 0
      }
    },
    adminDetails: {
      // No specific fields needed as _id will be used
    },
    loyaltyPoints: { type: Number, default: 0 },
    billing: {
      insurance: {
        provider: String,
        policyNumber: String,
        coverage: String,
        validTill: Date,
      },
      shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: 'India' },
      },
    },
    paymentMethods: {
      bankAccounts: [{
        bankName: String,
        accountNumberMasked: String,
        accountHolder: String,
        branchName: String,
      }],
      cards: [{
        brand: String,
        cardHolder: String,
        last4: String,
        expiryDate: String,
      }],
      mobileWallets: [{
        provider: String,
        mobileNumber: String,
      }],
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);