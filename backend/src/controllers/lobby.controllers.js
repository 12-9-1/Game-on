// Estado en memoria relacionado al lobby
const lobbies = {};
const userLobbies = {};

// Helper para obtener lobby a partir del socket
const getLobbyBySocket = (socket) => {
  const sid = socket.id;

  if (!userLobbies[sid]) {
    return { error: 'No estás en ningún lobby' };
  }

  const lobbyId = userLobbies[sid];
  const lobby = lobbies[lobbyId];

  if (!lobby) {
    return { error: 'Lobby no encontrado' };
  }

  return { lobbyId, lobby };
};

// Crear lobby
const handleCreateLobby = (io, socket, data) => {
  const sid = socket.id;
  const lobbyId = Math.random().toString(36).substring(2, 10);
  const playerName = data?.player_name || 'Jugador';
  const maxPlayers = data?.max_players || 4;

  lobbies[lobbyId] = {
    id: lobbyId,
    host: sid,
    players: [
      {
        socket_id: sid,
        name: playerName,
        is_host: true,
        ready: false,
        score: 0
      }
    ],
    max_players: maxPlayers,
    created_at: new Date().toISOString(),
    status: 'waiting'
  };

  socket.join(lobbyId);
  userLobbies[sid] = lobbyId;

  console.log(`Lobby creado: ${lobbyId} por ${playerName}`);

  socket.emit('lobby_created', {
    lobby: lobbies[lobbyId],
    message: `Lobby ${lobbyId} creado exitosamente`
  });
};

// Unirse a lobby
const handleJoinLobby = (io, socket, data) => {
  const sid = socket.id;
  const lobbyId = data?.lobby_id;
  const playerName = data?.player_name || 'Jugador';

  if (!lobbies[lobbyId]) {
    socket.emit('error', { message: 'Lobby no encontrado' });
    return;
  }

  const lobby = lobbies[lobbyId];

  if (lobby.players.length >= lobby.max_players) {
    socket.emit('error', { message: 'Lobby lleno' });
    return;
  }

  if (lobby.status !== 'waiting') {
    socket.emit('error', { message: 'El juego ya comenzó' });
    return;
  }

  const player = {
    socket_id: sid,
    name: playerName,
    is_host: false,
    ready: false,
    score: 0
  };
  lobby.players.push(player);

  socket.join(lobbyId);
  userLobbies[sid] = lobbyId;

  console.log(`${playerName} se unió al lobby ${lobbyId}`);

  socket.emit('lobby_joined', {
    lobby,
    message: `Te uniste al lobby ${lobbyId}`
  });

  socket.to(lobbyId).emit('player_joined', {
    lobby,
    player,
    player_count: lobby.players.length
  });
};

// Salir de lobby
const handleLeaveLobby = (io, socket) => {
  const sid = socket.id;

  if (!userLobbies[sid]) {
    socket.emit('error', { message: 'No estás en ningún lobby' });
    return;
  }

  const lobbyId = userLobbies[sid];

  if (!lobbies[lobbyId]) {
    delete userLobbies[sid];
    return;
  }

  const lobby = lobbies[lobbyId];
  const player = lobby.players.find(p => p.socket_id === sid);
  lobby.players = lobby.players.filter(p => p.socket_id !== sid);

  socket.leave(lobbyId);
  delete userLobbies[sid];

  if (lobby.players.length === 0) {
    delete lobbies[lobbyId];
    console.log(`Lobby ${lobbyId} eliminado (vacío)`);
  } else {
    if (player && player.is_host) {
      const newHost = lobby.players[0];
      newHost.is_host = true;
      newHost.ready = false;
      lobby.host = newHost.socket_id;
      console.log(`Nuevo host del lobby ${lobbyId}: ${newHost.name}`);
    }

    io.to(lobbyId).emit('player_left', {
      lobby,
      player_name: player ? player.name : 'Jugador',
      player_count: lobby.players.length
    });
  }

  socket.emit('lobby_left', { message: 'Saliste del lobby' });
};

// Listar lobbies disponibles
const handleGetLobbies = (io, socket) => {
  const availableLobbies = Object.values(lobbies)
    .filter(lobby => lobby.status === 'waiting')
    .map(lobby => ({
      id: lobby.id,
      player_count: lobby.players.length,
      max_players: lobby.max_players,
      status: lobby.status,
      host_name: lobby.players[0] ? lobby.players[0].name : 'Unknown'
    }));

  socket.emit('lobbies_list', { lobbies: availableLobbies });
};

// Cambiar estado ready
const handleToggleReady = (io, socket) => {
  const { error, lobbyId, lobby } = getLobbyBySocket(socket);
  if (error) {
    socket.emit('error', { message: error });
    return;
  }

  const sid = socket.id;

  for (const player of lobby.players) {
    if (player.socket_id === sid) {
      player.ready = !player.ready;
      break;
    }
  }

  io.to(lobbyId).emit('player_ready_changed', { lobby });
};

// Enviar mensaje de chat
const handleSendChatMessage = (io, socket, data) => {
  const { error, lobbyId, lobby } = getLobbyBySocket(socket);
  if (error) {
    socket.emit('error', { message: error });
    return;
  }

  const sid = socket.id;

  const player = lobby.players.find(p => p.socket_id === sid);
  if (!player) {
    socket.emit('error', { message: 'Jugador no encontrado' });
    return;
  }

  const message = (data?.message || '').trim();
  if (!message) {
    return;
  }

  const chatMessage = {
    socket_id: sid,
    player_name: player.name,
    message,
    timestamp: new Date().toISOString()
  };

  io.to(lobbyId).emit('chat_message', chatMessage);
};

// Obtener actualización del lobby actual
const handleGetLobbyUpdate = (io, socket) => {
  const { lobby } = getLobbyBySocket(socket);
  if (!lobby) {
    return;
  }

  socket.emit('lobby_updated', { lobby });
};

// Manejar desconexión
const handleDisconnect = (io, socket) => {
  const sid = socket.id;
  console.log(`Cliente desconectado: ${sid}`);

  if (userLobbies[sid]) {
    const lobbyId = userLobbies[sid];
    if (lobbies[lobbyId]) {
      const lobby = lobbies[lobbyId];
      let playerName = null;
      let wasHost = false;

      for (const player of lobby.players) {
        if (player.socket_id === sid) {
          playerName = player.name;
          wasHost = player.is_host;
          break;
        }
      }

      lobby.players = lobby.players.filter(p => p.socket_id !== sid);

      if (lobby.players.length === 0) {
        console.log(`Eliminando lobby ${lobbyId} - vacío`);
        delete lobbies[lobbyId];
        io.to(lobbyId).emit('lobby_closed', {
          message: 'El lobby está vacío'
        });
      } else {
        if (wasHost && lobby.players.length > 0) {
          const newHost = lobby.players[0];
          newHost.is_host = true;
          newHost.ready = false;
          lobby.host = newHost.socket_id;
          console.log(`Nuevo host del lobby ${lobbyId}: ${newHost.name}`);
        }

        lobby.player_count = lobby.players.length;

        console.log(`Jugador ${playerName} salió del lobby ${lobbyId}`);
        io.to(lobbyId).emit('player_left', {
          message: `${playerName} ha salido del lobby`,
          lobby
        });
      }
    }

    delete userLobbies[sid];
  }
};

module.exports = {
  lobbies,
  userLobbies,
  handleCreateLobby,
  handleJoinLobby,
  handleLeaveLobby,
  handleGetLobbies,
  handleToggleReady,
  handleSendChatMessage,
  handleGetLobbyUpdate,
  handleDisconnect
};