import mongoose from 'mongoose';

const emergencyNurseRatingSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyNurseRequest',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nurseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxLength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
emergencyNurseRatingSchema.index({ nurseId: 1, createdAt: -1 });
emergencyNurseRatingSchema.index({ requestId: 1, patientId: 1 }, { unique: true });
emergencyNurseRatingSchema.index({ rating: 1 });

// Static method to get average rating for a nurse
emergencyNurseRatingSchema.statics.getAverageRating = async function(nurseId) {
  const result = await this.aggregate([
    { $match: { nurseId: mongoose.Types.ObjectId(nurseId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  return result.length > 0 ? {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalRatings: result[0].totalRatings
  } : {
    averageRating: 0,
    totalRatings: 0
  };
};

// Static method to get rating distribution for a nurse
emergencyNurseRatingSchema.statics.getRatingDistribution = async function(nurseId) {
  const result = await this.aggregate([
    { $match: { nurseId: mongoose.Types.ObjectId(nurseId) } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  result.forEach(item => {
    distribution[item._id] = item.count;
  });

  return distribution;
};

export const EmergencyNurseRating = mongoose.model('EmergencyNurseRating', emergencyNurseRatingSchema);
