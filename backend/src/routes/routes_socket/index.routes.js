const { registerLobbySocketEvents } = require('./lobby_routes');
const { registerGameSocketEvents } = require('./game.routes');

const registerSocketEvents = (io) => {
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    socket.emit('connected', { message: 'Conectado al servidor' });

    registerLobbySocketEvents(io, socket);
    registerGameSocketEvents(io, socket);
  });
};

module.exports = { registerSocketEvents };