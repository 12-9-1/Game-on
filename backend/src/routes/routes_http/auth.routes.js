const express = require('express');
const { tokenRequired } = require('../../middleware/auth');
const {
  register,
  login,
  protectedRoute
} = require('../../controllers/auth.controllers');

const router = express.Router();

// POST /register
router.post('/register', register);

// POST /login
router.post('/login', login);

// GET /protected
router.get('/protected', tokenRequired, protectedRoute);

module.exports = router;