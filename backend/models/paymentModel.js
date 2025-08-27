import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
	orderId: {
		type: String,
		index: true,
	},
	appointmentId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Appointment',
		index: true,
	},
	doctorId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		index: true,
	},
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
		index: true,
	},
	amount: {
		type: Number,
		required: true,
		min: 0,
	},
	currency: {
		type: String,
		default: 'INR',
	},
	paymentMethod: {
		type: String,
		enum: ['mobile', 'card', 'bank', 'bKash', 'Rocket', 'Nagad', 'Qcash'],
		required: true,
	},
	status: {
		type: String,
		enum: ['pending', 'completed', 'failed', 'refunded'],
		default: 'pending',
		index: true,
	},
	paymentType: {
		type: String,
		default: 'marketplace',
	},
	description: {
		type: String,
		default: '',
	},
	transactionId: {
		type: String,
		index: true,
	},
	paymentDetails: {
		type: Object,
		default: {},
	},
	receiptPath: {
		type: String,
		default: '',
	},
	completedAt: {
		type: Date,
		default: null,
	},
}, { timestamps: true });

// Add debugging for schema
console.log('=== Payment Schema Debug ===');
console.log('Schema paths:', Object.keys(paymentSchema.paths));
console.log('Schema options:', paymentSchema.options);
console.log('Schema indexes:', paymentSchema.indexes());
console.log('Schema required fields:', Object.keys(paymentSchema.paths).filter(path => paymentSchema.paths[path].isRequired));
console.log('Schema enum values:', {
  paymentMethod: paymentSchema.paths.paymentMethod.enumValues,
  status: paymentSchema.paths.status.enumValues
});
console.log('Schema field types:', Object.keys(paymentSchema.paths).reduce((acc, path) => {
  acc[path] = paymentSchema.paths[path].instance;
  return acc;
}, {}));
console.log('Schema field validators:', Object.keys(paymentSchema.paths).reduce((acc, path) => {
  acc[path] = paymentSchema.paths[path].validators;
  return acc;
}, {}));
console.log('Schema field defaults:', Object.keys(paymentSchema.paths).reduce((acc, path) => {
  acc[path] = paymentSchema.paths[path].defaultValue;
  return acc;
}, {}));
console.log('Schema field required:', Object.keys(paymentSchema.paths).reduce((acc, path) => {
  acc[path] = paymentSchema.paths[path].isRequired;
  return acc;
}, {}));
console.log('Schema field indexes:', Object.keys(paymentSchema.paths).reduce((acc, path) => {
  acc[path] = paymentSchema.paths[path].index;
  return acc;
}, {}));
console.log('Schema field refs:', Object.keys(paymentSchema.paths).reduce((acc, path) => {
  acc[path] = paymentSchema.paths[path].ref;
  return acc;
}, {}));
console.log('Schema field min/max:', Object.keys(paymentSchema.paths).reduce((acc, path) => {
  acc[path] = {
    min: paymentSchema.paths[path].validators?.find(v => v.validator.name === 'min')?.arguments[0],
    max: paymentSchema.paths[path].validators?.find(v => v.validator.name === 'max')?.arguments[0]
  };
  return acc;
}, {}));
console.log('Schema field unique:', Object.keys(paymentSchema.paths).reduce((acc, path) => {
  acc[path] = paymentSchema.paths[path].unique;
  return acc;
}, {}));
console.log('Schema field sparse:', Object.keys(paymentSchema.paths).reduce((acc, path) => {
  acc[path] = paymentSchema.paths[path].sparse;
  return acc;
}, {}));
console.log('Schema field trim:', Object.keys(paymentSchema.paths).reduce((acc, path) => {
  acc[path] = paymentSchema.paths[path].trim;
  return acc;
}, {}));
console.log('Schema field lowercase:', Object.keys(paymentSchema.paths).reduce((acc, path) => {
  acc[path] = paymentSchema.paths[path].lowercase;
  return acc;
}, {}));
console.log('=== End Payment Schema Debug ===');

const Payment = mongoose.model('Payment', paymentSchema);

// Add some debugging
console.log('Payment model created:', Payment.modelName);
console.log('Payment schema paths:', Object.keys(paymentSchema.paths));
console.log('Payment schema options:', paymentSchema.options);

export default Payment;


