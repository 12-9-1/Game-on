const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');          // ya lo usabas en index.js
const lobbyRoutes = require('./lobby.routes');
const gameRoutes = require('./game.routes');

// /api/auth -> authRoutes
router.use('/auth', authRoutes);

// /api/lobbies -> lobbyRoutes
router.use('/lobbies', lobbyRoutes);

// /api/game -> gameRoutes
router.use('/game', gameRoutes);

module.exports = router;