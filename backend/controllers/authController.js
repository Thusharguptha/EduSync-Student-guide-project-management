import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const sign = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const validatePassword = (password) => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Za-z]/.test(password)) {
    return 'Password must contain at least one letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null;
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ message: 'Missing fields' });
    
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ message: passwordError });
    
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role, department });
    const token = sign(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department } });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = sign(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department } });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};
