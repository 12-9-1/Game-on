const { generateSingleQuestionSync, generateRoundQuestions } = require('../services/aiService');

// Almacenamiento en memoria
const lobbies = {};
const userLobbies = {};
const activeQuestions = {};
const playerAnswers = {};
const usedQuestionsCache = {};
const questionQueue = {};
const generationThreads = {};
const questionTimers = {};

/**
 * Registra todos los eventos de Socket.IO
 */
const registerSocketEvents = (io) => {
  io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);
    socket.emit('connected', { message: 'Conectado al servidor' });

    // ============ LOBBY EVENTS ============

    socket.on('create_lobby', (data) => {
      const sid = socket.id;
      const lobbyId = Math.random().toString(36).substring(2, 10);
      const playerName = data.player_name || 'Jugador';
      const maxPlayers = data.max_players || 4;

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
    });

    socket.on('join_lobby', (data) => {
      const sid = socket.id;
      const lobbyId = data.lobby_id;
      const playerName = data.player_name || 'Jugador';

      // Verificar si el lobby existe
      if (!lobbies[lobbyId]) {
        socket.emit('error', { message: 'Lobby no encontrado' });
        return;
      }

      const lobby = lobbies[lobbyId];

      // Verificar si el lobby está lleno
      if (lobby.players.length >= lobby.max_players) {
        socket.emit('error', { message: 'Lobby lleno' });
        return;
      }

      // Verificar si el juego ya comenzó
      if (lobby.status !== 'waiting') {
        socket.emit('error', { message: 'El juego ya comenzó' });
        return;
      }

      // Agregar jugador al lobby
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

      // Notificar al jugador que se unió
      socket.emit('lobby_joined', {
        lobby: lobby,
        message: `Te uniste al lobby ${lobbyId}`
      });

      // Notificar a todos en el lobby
      socket.to(lobbyId).emit('player_joined', {
        lobby: lobby,
        player: player,
        player_count: lobby.players.length
      });
    });

    socket.on('leave_lobby', () => {
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

      // Si el lobby está vacío, eliminarlo
      if (lobby.players.length === 0) {
        delete lobbies[lobbyId];
        console.log(`Lobby ${lobbyId} eliminado (vacío)`);
      } else {
        // Si el host se fue, asignar nuevo host
        if (player && player.is_host) {
          const newHost = lobby.players[0];
          newHost.is_host = true;
          newHost.ready = false;
          lobby.host = newHost.socket_id;
          console.log(`Nuevo host del lobby ${lobbyId}: ${newHost.name}`);
        }

        // Notificar a los demás
        io.to(lobbyId).emit('player_left', {
          lobby: lobby,
          player_name: player ? player.name : 'Jugador',
          player_count: lobby.players.length
        });
      }

      socket.emit('lobby_left', { message: 'Saliste del lobby' });
    });

    socket.on('get_lobbies', () => {
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
    });

    socket.on('toggle_ready', () => {
      const sid = socket.id;

      if (!userLobbies[sid]) {
        socket.emit('error', { message: 'No estás en ningún lobby' });
        return;
      }

      const lobbyId = userLobbies[sid];
      const lobby = lobbies[lobbyId];

      // Encontrar jugador y cambiar estado ready
      for (const player of lobby.players) {
        if (player.socket_id === sid) {
          player.ready = !player.ready;
          break;
        }
      }

      // Notificar a todos en el lobby
      io.to(lobbyId).emit('player_ready_changed', { lobby });
    });

    // ============ GAME EVENTS ============

    socket.on('start_game', async () => {
      const sid = socket.id;

      if (!userLobbies[sid]) {
        socket.emit('error', { message: 'No estás en ningún lobby' });
        return;
      }

      const lobbyId = userLobbies[sid];
      const lobby = lobbies[lobbyId];

      // Verificar que sea el host
      if (lobby.host !== sid) {
        socket.emit('error', { message: 'Solo el host puede iniciar el juego' });
        return;
      }

      // Verificar que todos estén listos (excepto el host)
      const allReady = lobby.players.every(p => p.ready || p.is_host);

      if (!allReady) {
        socket.emit('error', { message: 'No todos los jugadores están listos' });
        return;
      }

      // Cambiar estado del lobby
      lobby.status = 'playing';
      lobby.win_score = 10000;

      // Inicializar puntuaciones
      for (const player of lobby.players) {
        player.score = 0;
      }

      // Inicializar cola de preguntas
      questionQueue[lobbyId] = [];

      // Generar primera pregunta inmediatamente
      console.log(`Generando primera pregunta para el lobby ${lobbyId}...`);
      const firstQuestion = await generateSingleQuestionSync();

      if (!firstQuestion) {
        socket.emit('error', { message: 'Error generando pregunta inicial' });
        return;
      }

      // Inicializar datos del juego
      activeQuestions[lobbyId] = {
        current_question: firstQuestion,
        question_number: 1
      };

      // Iniciar generador de preguntas en background
      startQuestionGenerator(lobbyId, io);

      // Notificar a todos que el juego comienza
      io.to(lobbyId).emit('game_started', {
        lobby,
        win_score: 10000,
        message: '¡Primero en llegar a 10,000 puntos gana!'
      });

      // Emitir actualización del lobby con puntuaciones iniciales
      io.to(lobbyId).emit('lobby_updated', { lobby });

      // Enviar la primera pregunta después de 2 segundos
      setTimeout(() => {
        sendNextQuestion(lobbyId, io);
      }, 2000);
    });

    socket.on('submit_answer', (data) => {
      const sid = socket.id;

      if (!userLobbies[sid]) {
        socket.emit('error', { message: 'No estás en ningún lobby' });
        return;
      }

      const lobbyId = userLobbies[sid];

      if (!lobbies[lobbyId] || !activeQuestions[lobbyId]) {
        socket.emit('error', { message: 'No hay juego activo' });
        return;
      }

      const lobby = lobbies[lobbyId];
      const questionData = activeQuestions[lobbyId];
      const currentQuestion = questionData.current_question;

      // Verificar si el jugador ya respondió
      if (playerAnswers[lobbyId] && playerAnswers[lobbyId].answers[sid]) {
        socket.emit('error', { message: 'Ya respondiste esta pregunta' });
        return;
      }

      const answerIndex = data.answer_index;
      const answerTime = Date.now();

      // Calcular tiempo de respuesta
      const startTime = playerAnswers[lobbyId].start_time;
      const responseTime = (answerTime - startTime) / 1000;

      // Verificar si la respuesta es correcta
      const correctAnswer = playerAnswers[lobbyId].correct_answer;
      const isCorrect = answerIndex === correctAnswer;

      // Calcular puntos
      let points = 0;
      if (isCorrect) {
        const timeBonus = Math.max(0, 500 - Math.floor(responseTime * 20));
        points = 1000 + timeBonus;
      }

      // Actualizar puntuación del jugador
      let playerName = null;
      let playerScore = 0;
      for (const player of lobby.players) {
        if (player.socket_id === sid) {
          player.score = (player.score || 0) + points;
          playerName = player.name;
          playerScore = player.score;
          break;
        }
      }

      // Guardar respuesta
      playerAnswers[lobbyId].answers[sid] = {
        answer_index: answerIndex,
        is_correct: isCorrect,
        points,
        response_time: responseTime
      };

      // Notificar al jugador su resultado
      socket.emit('answer_result', {
        is_correct: isCorrect,
        points,
        total_score: playerScore,
        correct_answer: correctAnswer,
        explanation: currentQuestion.explanation || ''
      });

      // Notificar a todos que un jugador respondió
      io.to(lobbyId).emit('player_answered', {
        player_name: playerName,
        total_answered: Object.keys(playerAnswers[lobbyId].answers).length,
        total_players: lobby.players.length
      });

      // Emitir actualización del lobby con puntuaciones actualizadas
      io.to(lobbyId).emit('lobby_updated', { lobby });

      // Verificar si alguien ganó
      if (playerScore >= lobby.win_score) {
        console.log(`¡${playerName} ganó con ${playerScore} puntos!`);

        // Cancelar temporizador
        if (questionTimers[lobbyId]) {
          clearTimeout(questionTimers[lobbyId]);
        }

        setTimeout(() => {
          endGame(lobbyId, io);
        }, 2000);
        return;
      }

      // Si todos respondieron, pasar a la siguiente pregunta
      if (Object.keys(playerAnswers[lobbyId].answers).length >= lobby.players.length) {
        // Cancelar el temporizador automático
        if (questionTimers[lobbyId]) {
          clearTimeout(questionTimers[lobbyId]);
          console.log(`✓ Todos respondieron, cancelando temporizador automático`);
        }

        setTimeout(() => {
          const nextQuestion = getNextQuestion(lobbyId);

          if (nextQuestion) {
            activeQuestions[lobbyId].current_question = nextQuestion;
            activeQuestions[lobbyId].question_number += 1;
            sendNextQuestion(lobbyId, io);
          } else {
            console.log('No hay más preguntas disponibles');
            endGame(lobbyId, io);
          }
        }, 3000);
      }
    });

    socket.on('time_up', () => {
      const sid = socket.id;

      if (!userLobbies[sid]) {
        return;
      }

      const lobbyId = userLobbies[sid];

      if (!activeQuestions[lobbyId] || !playerAnswers[lobbyId]) {
        return;
      }

      // Si el jugador no respondió, registrar como respuesta incorrecta
      if (!playerAnswers[lobbyId].answers[sid]) {
        playerAnswers[lobbyId].answers[sid] = {
          answer_index: -1,
          is_correct: false,
          points: 0,
          response_time: 30
        };
      }
    });

    socket.on('request_new_round', () => {
      const sid = socket.id;

      if (!userLobbies[sid]) {
        socket.emit('error', { message: 'No estás en ningún lobby' });
        return;
      }

      const lobbyId = userLobbies[sid];

      if (!lobbies[lobbyId]) {
        socket.emit('error', { message: 'Lobby no encontrado' });
        return;
      }

      const lobby = lobbies[lobbyId];

      // Verificar que sea el host
      if (lobby.host !== sid) {
        socket.emit('error', { message: 'Solo el host puede iniciar una nueva ronda' });
        return;
      }

      // Cambiar estado a waiting_new_round
      lobby.status = 'waiting_new_round';

      // Resetear estado ready de todos los jugadores
      for (const player of lobby.players) {
        if (!player.is_host) {
          player.ready = false;
        }
      }

      console.log(`Nueva ronda solicitada en lobby ${lobbyId}`);

      // Notificar a todos
      io.to(lobbyId).emit('waiting_new_round', {
        lobby,
        message: 'Esperando a que todos estén listos para la nueva ronda'
      });
    });

    socket.on('ready_for_new_round', async () => {
      const sid = socket.id;

      if (!userLobbies[sid]) {
        socket.emit('error', { message: 'No estás en ningún lobby' });
        return;
      }

      const lobbyId = userLobbies[sid];
      const lobby = lobbies[lobbyId];

      // Marcar jugador como listo
      for (const player of lobby.players) {
        if (player.socket_id === sid) {
          player.ready = true;
          break;
        }
      }

      // Notificar a todos
      io.to(lobbyId).emit('player_ready_changed', { lobby });

      // Verificar si todos están listos
      const allReady = lobby.players.every(p => p.ready || p.is_host);

      if (allReady) {
        // Iniciar nueva ronda
        lobby.status = 'playing';

        // Resetear puntuaciones
        for (const player of lobby.players) {
          player.score = 0;
        }

        // Generar nuevas preguntas
        console.log(`Generando nuevas preguntas para el lobby ${lobbyId}...`);
        const questions = await generateRoundQuestions(5);

        // Guardar nuevas preguntas en el caché
        if (!usedQuestionsCache[lobbyId]) {
          usedQuestionsCache[lobbyId] = [];
        }

        for (const q of questions) {
          if (q.question) {
            usedQuestionsCache[lobbyId].push(q.question);
          }
        }

        // Almacenar preguntas del lobby
        activeQuestions[lobbyId] = {
          questions: questions,
          current_question_index: 0,
          total_questions: questions.length
        };

        // Notificar que la nueva ronda comienza
        io.to(lobbyId).emit('new_round_started', {
          lobby,
          total_questions: questions.length,
          message: '¡Nueva ronda comenzando!'
        });

        // Emitir actualización del lobby
        io.to(lobbyId).emit('lobby_updated', { lobby });

        // Enviar la primera pregunta después de 2 segundos
        setTimeout(() => {
          sendNextQuestion(lobbyId, io);
        }, 2000);
      }
    });

    socket.on('back_to_lobby', () => {
      const sid = socket.id;

      if (!userLobbies[sid]) {
        socket.emit('error', { message: 'No estás en ningún lobby' });
        return;
      }

      const lobbyId = userLobbies[sid];

      if (!lobbies[lobbyId]) {
        socket.emit('error', { message: 'Lobby no encontrado' });
        return;
      }

      const lobby = lobbies[lobbyId];

      // Verificar que sea el host
      if (lobby.host !== sid) {
        socket.emit('error', { message: 'Solo el host puede volver al lobby' });
        return;
      }

      // Cambiar estado a waiting
      lobby.status = 'waiting';

      // Resetear puntuaciones y estado ready
      for (const player of lobby.players) {
        player.score = 0;
        if (!player.is_host) {
          player.ready = false;
        }
      }

      // Limpiar datos del juego
      if (activeQuestions[lobbyId]) {
        delete activeQuestions[lobbyId];
      }
      if (playerAnswers[lobbyId]) {
        delete playerAnswers[lobbyId];
      }
      if (usedQuestionsCache[lobbyId]) {
        delete usedQuestionsCache[lobbyId];
      }

      console.log(`Volviendo al lobby ${lobbyId}`);

      // Notificar a todos
      io.to(lobbyId).emit('returned_to_lobby', {
        lobby,
        message: 'Volviendo al lobby'
      });
    });

    socket.on('send_chat_message', (data) => {
      const sid = socket.id;

      if (!userLobbies[sid]) {
        socket.emit('error', { message: 'No estás en ningún lobby' });
        return;
      }

      const lobbyId = userLobbies[sid];
      const lobby = lobbies[lobbyId];

      // Encontrar el jugador que envió el mensaje
      const player = lobby.players.find(p => p.socket_id === sid);
      if (!player) {
        socket.emit('error', { message: 'Jugador no encontrado' });
        return;
      }

      const message = (data.message || '').trim();
      if (!message) {
        return;
      }

      // Crear mensaje de chat
      const chatMessage = {
        socket_id: sid,
        player_name: player.name,
        message,
        timestamp: new Date().toISOString()
      };

      // Enviar mensaje a todos en el lobby
      io.to(lobbyId).emit('chat_message', chatMessage);
    });

    socket.on('get_lobby_update', () => {
      const sid = socket.id;

      if (!userLobbies[sid]) {
        return;
      }

      const lobbyId = userLobbies[sid];
      if (!lobbies[lobbyId]) {
        return;
      }

      const lobby = lobbies[lobbyId];

      // Enviar actualización del lobby
      socket.emit('lobby_updated', { lobby });
    });

    socket.on('disconnect', () => {
      const sid = socket.id;
      console.log(`Cliente desconectado: ${sid}`);

      // Remover usuario del lobby si estaba en uno
      if (userLobbies[sid]) {
        const lobbyId = userLobbies[sid];
        if (lobbies[lobbyId]) {
          const lobby = lobbies[lobbyId];
          let playerName = null;
          let wasHost = false;

          // Encontrar el jugador que se desconectó
          for (const player of lobby.players) {
            if (player.socket_id === sid) {
              playerName = player.name;
              wasHost = player.is_host;
              break;
            }
          }

          // Remover jugador
          lobby.players = lobby.players.filter(p => p.socket_id !== sid);

          // Si el lobby está vacío, eliminarlo
          if (lobby.players.length === 0) {
            console.log(`Eliminando lobby ${lobbyId} - vacío`);
            delete lobbies[lobbyId];
            io.to(lobbyId).emit('lobby_closed', {
              message: 'El lobby está vacío'
            });
          } else {
            // Si el host se desconectó, transferir el rol
            if (wasHost && lobby.players.length > 0) {
              const newHost = lobby.players[0];
              newHost.is_host = true;
              newHost.ready = false;
              lobby.host = newHost.socket_id;
              console.log(`Nuevo host del lobby ${lobbyId}: ${newHost.name}`);
            }

            // Actualizar el conteo de jugadores
            lobby.player_count = lobby.players.length;

            // Notificar a los demás jugadores
            console.log(`Jugador ${playerName} salió del lobby ${lobbyId}`);
            io.to(lobbyId).emit('player_left', {
              message: `${playerName} ha salido del lobby`,
              lobby
            });
          }
        }

        delete userLobbies[sid];
      }
    });
  });
};

/**
 * Inicia un thread que genera preguntas continuamente
 */
const startQuestionGenerator = (lobbyId, io) => {
  const generateQuestionsContinuously = async () => {
    console.log(`Thread de generación iniciado para lobby ${lobbyId}`);
    while (lobbies[lobbyId] && lobbies[lobbyId].status === 'playing') {
      if (questionQueue[lobbyId] && questionQueue[lobbyId].length < 2) {
        console.log(`Generando pregunta para cola del lobby ${lobbyId}...`);
        const question = await generateSingleQuestionSync();
        if (question) {
          questionQueue[lobbyId].push(question);
          console.log(`Pregunta agregada a cola. Total en cola: ${questionQueue[lobbyId].length}`);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.log(`Thread de generación terminado para lobby ${lobbyId}`);
  };

  const thread = generateQuestionsContinuously();
  generationThreads[lobbyId] = thread;
};

/**
 * Obtiene la siguiente pregunta de la cola
 */
const getNextQuestion = (lobbyId) => {
  if (!questionQueue[lobbyId]) {
    questionQueue[lobbyId] = [];
  }

  if (questionQueue[lobbyId].length > 0) {
    return questionQueue[lobbyId].shift();
  }

  return null;
};

/**
 * Envía la siguiente pregunta a todos los jugadores
 */
const sendNextQuestion = (lobbyId, io) => {
  if (!activeQuestions[lobbyId] || !lobbies[lobbyId]) {
    return;
  }

  const lobby = lobbies[lobbyId];
  const questionData = activeQuestions[lobbyId];
  const question = questionData.current_question;

  // Preparar pregunta sin la respuesta correcta
  const questionToSend = {
    question: question.question,
    options: question.options,
    difficulty: question.difficulty,
    category: question.category,
    question_number: questionData.question_number,
    time_limit: 30
  };

  // Inicializar respuestas para esta pregunta
  playerAnswers[lobbyId] = {
    start_time: Date.now(),
    answers: {},
    correct_answer: question.correct_answer
  };

  console.log(`Enviando pregunta #${questionData.question_number} al lobby ${lobbyId}`);

  // Enviar pregunta a todos los jugadores
  io.to(lobbyId).emit('new_question', questionToSend);

  // Emitir actualización del lobby
  io.to(lobbyId).emit('lobby_updated', { lobby });

  // Crear temporizador automático para avanzar cuando se acabe el tiempo
  const autoAdvance = () => {
    if (!lobbies[lobbyId] || !activeQuestions[lobbyId]) {
      return;
    }

    const currentLobby = lobbies[lobbyId];

    // Marcar como respondido (incorrectamente) a los jugadores que no respondieron
    if (playerAnswers[lobbyId]) {
      for (const player of currentLobby.players) {
        const playerSid = player.socket_id;
        if (!playerAnswers[lobbyId].answers[playerSid]) {
          playerAnswers[lobbyId].answers[playerSid] = {
            answer_index: -1,
            is_correct: false,
            points: 0,
            response_time: 30
          };
        }
      }
    }

    console.log(`⏰ Tiempo agotado para pregunta en lobby ${lobbyId}, avanzando...`);

    setTimeout(() => {
      const nextQuestion = getNextQuestion(lobbyId);

      if (nextQuestion) {
        activeQuestions[lobbyId].current_question = nextQuestion;
        activeQuestions[lobbyId].question_number += 1;
        sendNextQuestion(lobbyId, io);
      } else {
        console.log('No hay más preguntas disponibles');
        endGame(lobbyId, io);
      }
    }, 2000);
  };

  // Iniciar temporizador (32 segundos: 30 de pregunta + 2 de margen)
  questionTimers[lobbyId] = setTimeout(autoAdvance, 32000);
};

/**
 * Finaliza el juego y muestra resultados
 */
const endGame = (lobbyId, io) => {
  if (!lobbies[lobbyId]) {
    return;
  }

  // Cancelar temporizador
  if (questionTimers[lobbyId]) {
    clearTimeout(questionTimers[lobbyId]);
  }

  const lobby = lobbies[lobbyId];
  lobby.status = 'round_finished';

  // Ordenar jugadores por puntuación
  const sortedPlayers = [...lobby.players].sort((a, b) => (b.score || 0) - (a.score || 0));

  const results = sortedPlayers.map((player, idx) => ({
    name: player.name,
    score: player.score || 0,
    rank: idx + 1
  }));

  console.log(`Ronda terminada en lobby ${lobbyId}`);

  // Enviar resultados de la ronda
  io.to(lobbyId).emit('round_ended', {
    results,
    winner: results[0] || null
  });

  // Emitir actualización del lobby
  io.to(lobbyId).emit('lobby_updated', { lobby });

  // Limpiar datos de la ronda actual
  if (activeQuestions[lobbyId]) {
    delete activeQuestions[lobbyId];
  }
  if (playerAnswers[lobbyId]) {
    delete playerAnswers[lobbyId];
  }
};

module.exports = { registerSocketEvents };
