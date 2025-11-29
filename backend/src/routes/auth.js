const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { tokenRequired } = require('../middleware/auth');

const router = express.Router();

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validar campos obligatorios
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists!' });
    }
    
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear nuevo usuario
    const publicId = uuidv4();
    const newUser = new User({
      public_id: publicId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      created_at: new Date()
    });
    
    await newUser.save();
    
    // Generar JWT
    const token = jwt.sign(
      { public_id: publicId },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '1d' }
    );
    
    return res.status(201).json({
      message: 'User registered successfully!',
      token,
      user: {
        public_id: publicId,
        name,
        email
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar campos obligatorios
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required!' });
    }
    
    // Buscar usuario por email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password!' });
    }
    
    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password!' });
    }
    
    // Generar JWT
    const token = jwt.sign(
      { public_id: user.public_id },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '1d' }
    );
    
    return res.status(200).json({
      token,
      user: {
        public_id: user.public_id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// GET /protected
router.get('/protected', tokenRequired, (req, res) => {
  return res.status(200).json({
    message: `Hello ${req.currentUser.name}! This is a protected route.`
  });
});

module.exports = router;
