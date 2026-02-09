import mongoose from 'mongoose';

const panelSchema = new mongoose.Schema(
  {
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    room: { type: String },
    timeSlot: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('Panel', panelSchema);
