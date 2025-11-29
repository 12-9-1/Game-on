# Integración con Frontend React

Este documento muestra cómo conectar tu frontend React con el nuevo backend Node.js.

## Configuración Básica

### 1. Instalar Socket.IO Client
```bash
npm install socket.io-client
```

### 2. Crear Contexto de Socket (Recomendado)

Crea `src/contexts/SocketContext.jsx`:

```javascript
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Conectar a Node.js backend
    const newSocket = io('http://localhost:5000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✓ Conectado al servidor');
    });

    newSocket.on('disconnect', () => {
      console.log('✗ Desconectado del servidor');
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe usarse dentro de SocketProvider');
  }
  return context;
};
```

### 3. Usar en App.jsx

```javascript
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <SocketProvider>
      {/* Tu aplicación aquí */}
    </SocketProvider>
  );
}

export default App;
```

## Ejemplos de Uso

### Autenticación

#### Registro
```javascript
const handleRegister = async (name, email, password) => {
  try {
    const response = await fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('✓ Registrado exitosamente');
    } else {
      console.error('✗ Error:', data.message);
    }
  } catch (error) {
    console.error('✗ Error de red:', error);
  }
};
```

#### Login
```javascript
const handleLogin = async (email, password) => {
  try {
    const response = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('✓ Login exitoso');
    } else {
      console.error('✗ Error:', data.message);
    }
  } catch (error) {
    console.error('✗ Error de red:', error);
  }
};
```

#### Ruta Protegida
```javascript
const handleProtectedRoute = async () => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('http://localhost:5000/protected', {
      method: 'GET',
      headers: {
        'x-access-token': token
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✓', data.message);
    } else {
      console.error('✗ Error:', data.message);
    }
  } catch (error) {
    console.error('✗ Error de red:', error);
  }
};
```

### Lobbies

#### Crear Lobby
```javascript
const socket = useSocket();

const handleCreateLobby = (playerName, maxPlayers = 4) => {
  socket.emit('create_lobby', {
    player_name: playerName,
    max_players: maxPlayers
  });

  socket.on('lobby_created', (data) => {
    console.log('✓ Lobby creado:', data.lobby.id);
    // Guardar lobby_id para usar después
  });
};
```

#### Unirse a Lobby
```javascript
const handleJoinLobby = (lobbyId, playerName) => {
  socket.emit('join_lobby', {
    lobby_id: lobbyId,
    player_name: playerName
  });

  socket.on('lobby_joined', (data) => {
    console.log('✓ Te uniste al lobby:', data.lobby.id);
  });

  socket.on('error', (data) => {
    console.error('✗ Error:', data.message);
  });
};
```

#### Obtener Lobbies Disponibles
```javascript
const handleGetLobbies = () => {
  socket.emit('get_lobbies');

  socket.on('lobbies_list', (data) => {
    console.log('Lobbies disponibles:', data.lobbies);
    // data.lobbies es un array de lobbies
  });
};
```

#### Salir del Lobby
```javascript
const handleLeaveLobby = () => {
  socket.emit('leave_lobby');

  socket.on('lobby_left', (data) => {
    console.log('✓', data.message);
  });
};
```

#### Toggle Ready
```javascript
const handleToggleReady = () => {
  socket.emit('toggle_ready');

  socket.on('player_ready_changed', (data) => {
    console.log('Estado actualizado:', data.lobby);
  });
};
```

### Juego

#### Iniciar Juego
```javascript
const handleStartGame = () => {
  socket.emit('start_game');

  socket.on('game_started', (data) => {
    console.log('✓ Juego iniciado');
    console.log('Objetivo:', data.win_score, 'puntos');
  });

  socket.on('new_question', (data) => {
    console.log('Pregunta #' + data.question_number);
    console.log('Pregunta:', data.question);
    console.log('Opciones:', data.options);
    console.log('Tiempo:', data.time_limit, 'segundos');
  });
};
```

#### Enviar Respuesta
```javascript
const handleSubmitAnswer = (answerIndex) => {
  socket.emit('submit_answer', {
    answer_index: answerIndex
  });

  socket.on('answer_result', (data) => {
    if (data.is_correct) {
      console.log('✓ ¡Correcto!');
    } else {
      console.log('✗ Incorrecto');
      console.log('Respuesta correcta:', data.correct_answer);
    }
    console.log('Puntos ganados:', data.points);
    console.log('Puntuación total:', data.total_score);
    console.log('Explicación:', data.explanation);
  });
};
```

#### Notificación de Tiempo Agotado
```javascript
const handleTimeUp = () => {
  socket.emit('time_up');
};

// Usar en un timer
useEffect(() => {
  const timer = setTimeout(() => {
    handleTimeUp();
  }, 30000); // 30 segundos

  return () => clearTimeout(timer);
}, []);
```

#### Escuchar Actualizaciones del Lobby
```javascript
socket.on('lobby_updated', (data) => {
  console.log('Lobby actualizado:', data.lobby);
  // data.lobby contiene el estado actual del lobby
  // Incluye scores de todos los jugadores
});

socket.on('player_answered', (data) => {
  console.log(`${data.player_name} respondió`);
  console.log(`${data.total_answered}/${data.total_players} han respondido`);
});
```

#### Fin de Ronda
```javascript
socket.on('round_ended', (data) => {
  console.log('¡Ronda terminada!');
  console.log('Resultados:', data.results);
  console.log('Ganador:', data.winner);
  // data.results es un array con ranking
});
```

#### Nueva Ronda
```javascript
const handleRequestNewRound = () => {
  socket.emit('request_new_round');

  socket.on('waiting_new_round', (data) => {
    console.log('Esperando nueva ronda...');
  });
};

const handleReadyForNewRound = () => {
  socket.emit('ready_for_new_round');

  socket.on('new_round_started', (data) => {
    console.log('✓ Nueva ronda iniciada');
  });
};
```

#### Volver al Lobby
```javascript
const handleBackToLobby = () => {
  socket.emit('back_to_lobby');

  socket.on('returned_to_lobby', (data) => {
    console.log('✓ Volviste al lobby');
  });
};
```

### Chat

#### Enviar Mensaje
```javascript
const handleSendMessage = (message) => {
  socket.emit('send_chat_message', {
    message: message
  });
};
```

#### Recibir Mensajes
```javascript
socket.on('chat_message', (data) => {
  console.log(`${data.player_name}: ${data.message}`);
  // data.timestamp contiene la hora del mensaje
});
```

### Actualización del Lobby
```javascript
const handleGetLobbyUpdate = () => {
  socket.emit('get_lobby_update');

  socket.on('lobby_updated', (data) => {
    console.log('Estado actual del lobby:', data.lobby);
  });
};
```

## Manejo de Errores

```javascript
socket.on('error', (data) => {
  console.error('Error del servidor:', data.message);
  
  // Mostrar error al usuario
  alert(data.message);
});

socket.on('disconnect', () => {
  console.log('Desconectado del servidor');
  // Mostrar mensaje de reconexión
});

socket.on('connect_error', (error) => {
  console.error('Error de conexión:', error);
});
```

## Hook Personalizado para Lobbies

```javascript
// src/hooks/useLobby.js
import { useSocket } from '../contexts/SocketContext';
import { useState, useCallback } from 'react';

export const useLobby = () => {
  const socket = useSocket();
  const [lobby, setLobby] = useState(null);
  const [lobbies, setLobbies] = useState([]);

  const createLobby = useCallback((playerName, maxPlayers = 4) => {
    socket.emit('create_lobby', { player_name: playerName, max_players: maxPlayers });
  }, [socket]);

  const joinLobby = useCallback((lobbyId, playerName) => {
    socket.emit('join_lobby', { lobby_id: lobbyId, player_name: playerName });
  }, [socket]);

  const leaveLobby = useCallback(() => {
    socket.emit('leave_lobby');
  }, [socket]);

  const getLobbies = useCallback(() => {
    socket.emit('get_lobbies');
  }, [socket]);

  const toggleReady = useCallback(() => {
    socket.emit('toggle_ready');
  }, [socket]);

  // Listeners
  socket.on('lobby_created', (data) => setLobby(data.lobby));
  socket.on('lobby_joined', (data) => setLobby(data.lobby));
  socket.on('lobbies_list', (data) => setLobbies(data.lobbies));
  socket.on('lobby_updated', (data) => setLobby(data.lobby));

  return {
    lobby,
    lobbies,
    createLobby,
    joinLobby,
    leaveLobby,
    getLobbies,
    toggleReady
  };
};
```

Uso:
```javascript
const { lobby, lobbies, createLobby, joinLobby } = useLobby();

// En tu componente
<button onClick={() => createLobby('Juan', 4)}>
  Crear Lobby
</button>
```

## Estructura de Datos Esperada

### Lobby
```javascript
{
  id: "a1b2c3d4",
  host: "socket_id_del_host",
  players: [
    {
      socket_id: "socket_id_1",
      name: "Juan",
      is_host: true,
      ready: true,
      score: 0
    },
    {
      socket_id: "socket_id_2",
      name: "María",
      is_host: false,
      ready: false,
      score: 0
    }
  ],
  max_players: 4,
  status: "waiting",
  win_score: 10000,
  created_at: "2024-01-01T12:00:00.000Z"
}
```

### Pregunta
```javascript
{
  question: "¿Cuál es la capital de Francia?",
  options: ["París", "Londres", "Berlín", "Madrid"],
  difficulty: "easy",
  category: "Geografía",
  question_number: 1,
  time_limit: 30
}
```

### Respuesta
```javascript
{
  is_correct: true,
  points: 1250,
  total_score: 1250,
  correct_answer: 0,
  explanation: "La respuesta correcta es: París"
}
```

## Notas Importantes

1. **Token JWT**: Almacena en `localStorage` después del login
2. **Socket.IO**: Se conecta automáticamente al iniciar la app
3. **Reconexión**: Socket.IO reintentar automáticamente si se desconecta
4. **CORS**: Ya está configurado en el backend
5. **Errores**: Siempre escucha el evento `error` para manejar problemas

## Verificación

Para verificar que todo está funcionando:

1. Abre la consola del navegador (F12)
2. Deberías ver: "✓ Conectado al servidor"
3. Intenta crear un lobby
4. Deberías ver: "✓ Lobby creado: [id]"

¡Listo! Tu frontend está integrado con el backend Node.js. 🎉
