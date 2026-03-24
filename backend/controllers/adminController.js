import User from '../models/User.js';
import xlsx from 'xlsx';

// Bulk register users from Excel
export const bulkRegisterUsers = async (req, res) => {
  try {
    console.log('Bulk register endpoint hit');
    console.log('File received:', req.file ? 'Yes' : 'No');

    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File details:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel row (header is row 1)

      try {
        // Validate required fields
        if (!row.Name || !row.Email || !row.Role) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'Missing required fields (Name, Email, Role)'
          });
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.Email)) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'Invalid email format'
          });
          continue;
        }

        // Validate role
        if (!['student', 'teacher', 'admin'].includes(row.Role.toLowerCase())) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'Role must be student, teacher, or admin'
          });
          continue;
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: row.Email });
        if (existingUser) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: 'Email already exists'
          });
          continue;
        }

        // Generate password: First 4 letters of name + @123
        const namePart = row.Name.substring(0, 4);
        const password = `${namePart}@123`;

        // Create user
        await User.create({
          name: row.Name,
          email: row.Email,
          password, // Will be hashed by pre-save hook
          role: row.Role.toLowerCase(),
          department: row.Department || ''
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: error.message
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Bulk registration error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Error processing file',
      error: error.message,
      details: error.stack
    });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

export const listUsers = async (req, res) => {
  const users = await User.find({ role: { $in: ['teacher', 'student'] } }).select('-password');
  res.json(users);
};

export const createUser = async (req, res) => {
  const { name, email, password, role, department } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ message: 'Missing fields' });
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already registered' });
  // Don't hash password here - User model pre-save hook will do it
  const user = await User.create({ name, email, password, role, department });
  res.status(201).json({ id: user._id });
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { name, email, role, department },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

export const allocateGuide = async (req, res) => {
  const { studentId, teacherId } = req.body;
  if (!studentId || !teacherId) return res.status(400).json({ message: 'Missing fields' });
  const Allocation = (await import('../models/Allocation.js')).default;
  const Project = (await import('../models/Project.js')).default;
  const alloc = await Allocation.findOneAndUpdate(
    { studentId },
    { studentId, teacherId, assignedBy: req.user._id },
    { new: true, upsert: true }
  );
  // Only update guideId if project already exists (don't create draft project)
  await Project.updateOne({ studentId }, { guideId: teacherId });
  res.json(alloc);
};

export const listAllocations = async (req, res) => {
  const Allocation = (await import('../models/Allocation.js')).default;
  const list = await Allocation.find().populate('studentId', 'name email').populate('teacherId', 'name email');
  res.json(list);
};

export const createPanel = async (req, res) => {
  const { members, students, room, timeSlot } = req.body;
  const Panel = (await import('../models/Panel.js')).default;
  const panel = await Panel.create({ members, students, room, timeSlot });
  res.status(201).json(panel);
};

export const listPanels = async (req, res) => {
  try {
    const Panel = (await import('../models/Panel.js')).default;
    const panels = await Panel.find()
      .populate('members', 'name email role')
      .populate('students', 'name email role')
      .sort({ timeSlot: -1 });
    res.json(panels);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching panels', error: error.message });
  }
};

export const dashboardStats = async (req, res) => {
  const Panel = (await import('../models/Panel.js')).default;
  const Project = (await import('../models/Project.js')).default;
  const [students, teachers, panels, projects] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    Panel.countDocuments(),
    Project.countDocuments()
  ]);
  res.json({ students, teachers, panels, projects });
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete admin' });

    const Allocation = (await import('../models/Allocation.js')).default;
    const Project = (await import('../models/Project.js')).default;
    await Promise.all([
      Allocation.deleteMany({ $or: [{ studentId: id }, { teacherId: id }] }),
      Project.deleteMany({ $or: [{ studentId: id }, { guideId: id }] }),
    ]);
    await user.deleteOne();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};
export const autoCreatePanels = async (req, res) => {
  try {
    const { startTime, durationMins, studentsPerPanel, teachersPerPanel, rooms } = req.body;
    if (!startTime || !durationMins || !studentsPerPanel || !teachersPerPanel || !rooms || rooms.length === 0) {
      return res.status(400).json({ message: 'Missing required scheduling parameters' });
    }

    const Panel = (await import('../models/Panel.js')).default;
    
    // 1. Get all students not in a panel
    const existingPanels = await Panel.find().select('students');
    const assignedStudents = existingPanels.flatMap(p => p.students.map(s => s.toString()));
    const unassignedStudents = await User.find({ 
      role: 'student', 
      _id: { $nin: assignedStudents } 
    }).select('_id');

    if (unassignedStudents.length === 0) {
      return res.status(400).json({ message: 'No unassigned students found' });
    }

    // 2. Get all teachers
    const teachers = await User.find({ role: 'teacher' }).select('_id');
    if (teachers.length < teachersPerPanel) {
        return res.status(400).json({ message: `Not enough teachers. Need at least ${teachersPerPanel}.` });
    }

    // 3. Create groups of students
    const studentGroups = [];
    for (let i = 0; i < unassignedStudents.length; i += studentsPerPanel) {
      studentGroups.push(unassignedStudents.slice(i, i + studentsPerPanel).map(s => s._id));
    }

    // 4. Create panels
    const createdPanels = [];
    let currentTime = new Date(startTime);
    let busyTeachers = new Set();
    let currentRoomIndex = 0;

    for (let i = 0; i < studentGroups.length; i++) {
        const group = studentGroups[i];
        
        // Find available teachers for this slot
        const availableTeachers = teachers.filter(t => !busyTeachers.has(t._id.toString()));
        
        // If not enough teachers or we ran out of rooms for this slot, move to next time slot
        if (availableTeachers.length < teachersPerPanel || currentRoomIndex >= rooms.length) {
            currentTime = new Date(currentTime.getTime() + durationMins * 60000);
            busyTeachers.clear();
            currentRoomIndex = 0;
            // Retry selecting available teachers for the new slot
            // Since we moved time, we need to pick from the full list again
            i--; // Decrement i so the loop re-processes this same group
            continue;
        }

        // Select Teachers (Sequential from the available list)
        // We'll just take the top ones from available list
        const selectedTeachers = availableTeachers.slice(0, teachersPerPanel).map(t => t._id);
        selectedTeachers.forEach(id => busyTeachers.add(id.toString()));

        // Select Room
        const room = rooms[currentRoomIndex].trim();
        currentRoomIndex++;

        const panel = await Panel.create({
            members: selectedTeachers,
            students: group,
            room,
            timeSlot: new Date(currentTime)
        });
        createdPanels.push(panel);
    }

    res.status(201).json({ 
        message: `Successfully created ${createdPanels.length} panels`,
        count: createdPanels.length 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error automating panels', error: error.message });
  }
};
