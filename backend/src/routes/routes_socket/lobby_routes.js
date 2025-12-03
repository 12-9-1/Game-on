const {
  handleCreateLobby,
  handleJoinLobby,
  handleLeaveLobby,
  handleGetLobbies,
  handleToggleReady,
  handleSendChatMessage,
  handleGetLobbyUpdate,
  handleDisconnect
} = require('../../controllers/lobby.controllers');


const lobbySocketEvents = (io) => {
 
    // ===== LOBBY EVENTS =====
    socket.on('create_lobby', (data) => handleCreateLobby(io, socket, data));
    socket.on('join_lobby', (data) => handleJoinLobby(io, socket, data));
    socket.on('leave_lobby', () => handleLeaveLobby(io, socket));
    socket.on('get_lobbies', () => handleGetLobbies(io, socket));
    socket.on('toggle_ready', () => handleToggleReady(io, socket));
    socket.on('send_chat_message', (data) => handleSendChatMessage(io, socket, data));
    socket.on('get_lobby_update', () => handleGetLobbyUpdate(io, socket));

    // ===== DISCONNECT =====
    socket.on('disconnect', () => handleDisconnect(io, socket));
};

module.exports = { lobbySocketEvents };