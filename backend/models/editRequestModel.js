import mongoose from "mongoose";

const editRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true
    },
    customerCareOfficerId: {
      type: String,
      required: true
    },
    customerCareOfficerName: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    requestType: {
      type: String,
      enum: ['profile_update', 'password_reset', 'role_change', 'verification', 'other'],
      required: true
    },
    currentData: {
      type: String,
      required: false,
      default: ''
    },
    requestedChanges: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    adminNotes: {
      type: String,
      default: ''
    },
    adminId: {
      type: String
    },
    adminName: {
      type: String
    },
    processedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Generate unique request ID
editRequestSchema.pre('save', async function(next) {
  if (!this.requestId) {
    this.requestId = `ER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

export const EditRequest = mongoose.model("EditRequest", editRequestSchema);
