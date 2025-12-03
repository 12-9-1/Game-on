
const {
  handleStartGame,
  handleSubmitAnswer,
  handleTimeUp,
  handleRequestNewRound,
  handleReadyForNewRound,
  handleBackToLobby
} = require('../../controllers/game.controllers');

const gameSocketEvents = (io) => {
    // ===== GAME EVENTS =====
    socket.on('start_game', () => handleStartGame(io, socket));
    socket.on('submit_answer', (data) => handleSubmitAnswer(io, socket, data));
    socket.on('time_up', () => handleTimeUp(io, socket));
    socket.on('request_new_round', () => handleRequestNewRound(io, socket));
    socket.on('ready_for_new_round', () => handleReadyForNewRound(io, socket));
    socket.on('back_to_lobby', () => handleBackToLobby(io, socket));
};

module.exports = { gameSocketEvents };