import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'driver'
    },
    ambulance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ambulance'
    },
    pickupLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    destination: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'on_the_way', 'nearby', 'arrived', 'completed', 'cancelled'],
        default: 'pending'
    },
    vehicleType: {
        type: String,
        enum: ['AC', 'ICU', 'VIP'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    amount: {
        type: Number,
        required: true
    },
    emergencyType: {
        type: String,
        required: true
    },
    notes: {
        type: String
    }
}, { timestamps: true });

emergencyRequestSchema.index({ pickupLocation: '2dsphere' });
emergencyRequestSchema.index({ destination: '2dsphere' });

const EmergencyRequest = mongoose.model('emergencyRequest', emergencyRequestSchema);
export default EmergencyRequest; 