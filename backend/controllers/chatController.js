import ChatMessage from '../models/ChatMessage.js';

export const getDirectHistory = async (req, res) => {
  const otherId = req.params.userId;
  const userId = req.user._id.toString();
  const roomIdA = `direct:${userId}:${otherId}`;
  const roomIdB = `direct:${otherId}:${userId}`;
  const messages = await ChatMessage.find({
    roomType: 'direct',
    roomId: { $in: [roomIdA, roomIdB] },
  })
    .sort({ createdAt: 1 })
    .limit(200)
    .populate('senderId', 'name role')
    .populate('receiverId', 'name role');
  res.json(messages);
};

export const getBroadcastHistory = async (req, res) => {
  const userId = req.user._id.toString();
  // For teacher: their own broadcast room
  if (req.user.role === 'teacher') {
    const roomId = `broadcast:${userId}`;
    const messages = await ChatMessage.find({ roomType: 'broadcast', roomId })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate('senderId', 'name role');
    return res.json(messages);
  }
  // For student: broadcasts from their guide
  if (req.user.role === 'student') {
    const Allocation = (await import('../models/Allocation.js')).default;
    const alloc = await Allocation.findOne({ studentId: userId });
    if (!alloc) return res.json([]);
    const roomId = `broadcast:${alloc.teacherId.toString()}`;
    const messages = await ChatMessage.find({ roomType: 'broadcast', roomId })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate('senderId', 'name role');
    return res.json(messages);
  }
  res.json([]);
};
