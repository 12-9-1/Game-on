const express = require('express');
const router = express.Router();

const { lobbies } = require('../../controllers/lobby.controllers');
const {
  activeQuestions,
  playerAnswers
} = require('../../controllers/game.controllers');

// GET /api/game/:lobbyId/state
// Devuelve el estado básico del juego para un lobby
router.get('/:lobbyId/state', (req, res) => {
  const { lobbyId } = req.params;

  const lobby = lobbies[lobbyId];
  if (!lobby) {
    return res.status(404).json({ message: 'Lobby no encontrado' });
  }

  const questionData = activeQuestions[lobbyId] || null;
  const answersData = playerAnswers[lobbyId] || null;

  res.json({
    lobby: {
      id: lobby.id,
      status: lobby.status,
      win_score: lobby.win_score,
      players: lobby.players
    },
    active_question: questionData ? questionData.current_question || null : null,
    question_meta: questionData
      ? {
          question_number: questionData.question_number,
          total_questions: questionData.total_questions
        }
      : null,
    answers: answersData ? answersData.answers || {} : {}
  });
});

module.exports = router;