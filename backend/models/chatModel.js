import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['Patient', 'CustomerCare'], required: true },
  text: { type: String },
  attachments: [{ url: String, name: String }],
}, { timestamps: true });

const chatSessionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['open', 'assigned', 'closed'], default: 'open', index: true },
  lastMessageAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

export const ChatMessage = mongoose.model('ChatMessage', messageSchema);
export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);


