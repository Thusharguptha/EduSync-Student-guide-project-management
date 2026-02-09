import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    roomType: { type: String, enum: ['direct', 'broadcast'], required: true },
    roomId: { type: String, required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

export default mongoose.model('ChatMessage', chatMessageSchema);
