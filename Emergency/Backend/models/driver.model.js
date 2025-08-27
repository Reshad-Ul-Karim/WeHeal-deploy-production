import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const driverSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    phone: {
        type: String,
        required: true
    },
    profilePhoto: {
        type: String,
        required: true
    },
    licenseNumber: {
        type: String,
        required: true,
        unique: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    currentRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'emergencyRequest'
    },
    socketId: {
        type: String
    }
}, { timestamps: true });

driverSchema.methods.generateAuthToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

driverSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

driverSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const Driver = mongoose.model('driver', driverSchema);
export default Driver; 