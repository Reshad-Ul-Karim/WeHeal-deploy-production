import mongoose from 'mongoose';

const ambulanceSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'driver',
        required: true
    },
    vehicleType: {
        type: String,
        enum: ['AC', 'ICU', 'VIP'],
        required: true
    },
    vehicleName: {
        type: String,
        required: true
    },
    plateNumber: {
        type: String,
        required: true,
        unique: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    }
}, { timestamps: true });

ambulanceSchema.index({ currentLocation: '2dsphere' });

const Ambulance = mongoose.model('ambulance', ambulanceSchema);
export default Ambulance; 