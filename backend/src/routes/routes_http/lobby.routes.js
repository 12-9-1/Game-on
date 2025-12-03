const express = require('express');
const router = express.Router();

const { lobbies } = require('../../controllers/lobby.controllers');

// GET /api/lobbies
// Devuelve la lista de lobbies disponibles (similar a get_lobbies de sockets)
router.get('/', (req, res) => {
  const availableLobbies = Object.values(lobbies).map((lobby) => ({
    id: lobby.id,
    player_count: lobby.players.length,
    max_players: lobby.max_players,
    status: lobby.status,
    host_name: lobby.players[0] ? lobby.players[0].name : 'Unknown',
    created_at: lobby.created_at
  }));

  res.json({ lobbies: availableLobbies });
});

// GET /api/lobbies/:lobbyId
// Devuelve el detalle de un lobby concreto
router.get('/:lobbyId', (req, res) => {
  const { lobbyId } = req.params;
  const lobby = lobbies[lobbyId];

  if (!lobby) {
    return res.status(404).json({ message: 'Lobby no encontrado' });
  }

  res.json({ lobby });
});

module.exports = router;