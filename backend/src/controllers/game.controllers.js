const { generateSingleQuestionSync, generateRoundQuestions } = require('../services/aiService');
const { lobbies, userLobbies } = require('./lobby.controllers');

// Estado en memoria del juego
const activeQuestions = {};
const playerAnswers = {};
const usedQuestionsCache = {};
const questionQueue = {};
const generationThreads = {};
const questionTimers = {};

// Helper: obtener lobby a partir del socket
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

// ===================== HELPERS DE PREGUNTAS =====================

// Inicia un thread que genera preguntas continuamente
const startQuestionGenerator = (lobbyId) => {
  const generateQuestionsContinuously = async () => {
    console.log(`Thread de generación iniciado para lobby ${lobbyId}`);
    while (lobbies[lobbyId] && lobbies[lobbyId].status === 'playing') {
      if (questionQueue[lobbyId] && questionQueue[lobbyId].length < 2) {
        console.log(`Generando pregunta para cola del lobby ${lobbyId}...`);
        const question = await generateSingleQuestionSync();
        if (question) {
          questionQueue[lobbyId].push(question);
          console.log(
            `Pregunta agregada a cola. Total en cola: ${questionQueue[lobbyId].length}`
          );
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    console.log(`Thread de generación terminado para lobby ${lobbyId}`);
  };

  const thread = generateQuestionsContinuously();
  generationThreads[lobbyId] = thread;
};

// Obtiene la siguiente pregunta de la cola
const getNextQuestion = (lobbyId) => {
  if (!questionQueue[lobbyId]) {
    questionQueue[lobbyId] = [];
  }

  if (questionQueue[lobbyId].length > 0) {
    return questionQueue[lobbyId].shift();
  }

  return null;
};

// Envía la siguiente pregunta a todos los jugadores
const sendNextQuestion = (io, lobbyId) => {
  if (!activeQuestions[lobbyId] || !lobbies[lobbyId]) {
    return;
  }

  const lobby = lobbies[lobbyId];
  const questionData = activeQuestions[lobbyId];
  const question = questionData.current_question;

  const questionToSend = {
    question: question.question,
    options: question.options,
    difficulty: question.difficulty,
    category: question.category,
    question_number: questionData.question_number,
    time_limit: 30
  };

  playerAnswers[lobbyId] = {
    start_time: Date.now(),
    answers: {},
    correct_answer: question.correct_answer
  };

  console.log(`Enviando pregunta #${questionData.question_number} al lobby ${lobbyId}`);

  io.to(lobbyId).emit('new_question', questionToSend);
  io.to(lobbyId).emit('lobby_updated', { lobby });

  const autoAdvance = () => {
    if (!lobbies[lobbyId] || !activeQuestions[lobbyId]) {
      return;
    }

    const currentLobby = lobbies[lobbyId];

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
        sendNextQuestion(io, lobbyId);
      } else {
        console.log('No hay más preguntas disponibles');
        endGame(io, lobbyId);
      }
    }, 2000);
  };

  // 32 segundos: 30 de pregunta + 2 de margen
  questionTimers[lobbyId] = setTimeout(autoAdvance, 32000);
};

// Finaliza el juego y muestra resultados
const endGame = (io, lobbyId) => {
  if (!lobbies[lobbyId]) {
    return;
  }

  if (questionTimers[lobbyId]) {
    clearTimeout(questionTimers[lobbyId]);
  }

  const lobby = lobbies[lobbyId];
  lobby.status = 'round_finished';

  const sortedPlayers = [...lobby.players].sort(
    (a, b) => (b.score || 0) - (a.score || 0)
  );

  const results = sortedPlayers.map((player, idx) => ({
    name: player.name,
    score: player.score || 0,
    rank: idx + 1
  }));

  console.log(`Ronda terminada en lobby ${lobbyId}`);

  io.to(lobbyId).emit('round_ended', {
    results,
    winner: results[0] || null
  });

  io.to(lobbyId).emit('lobby_updated', { lobby });

  if (activeQuestions[lobbyId]) {
    delete activeQuestions[lobbyId];
  }
  if (playerAnswers[lobbyId]) {
    delete playerAnswers[lobbyId];
  }
};

// ===================== HANDLERS DE EVENTOS DE JUEGO =====================

// start_game
const handleStartGame = async (io, socket) => {
  const sid = socket.id;

  if (!userLobbies[sid]) {
    socket.emit('error', { message: 'No estás en ningún lobby' });
    return;
  }

  const lobbyId = userLobbies[sid];
  const lobby = lobbies[lobbyId];

  if (!lobby) {
    socket.emit('error', { message: 'Lobby no encontrado' });
    return;
  }

  if (lobby.host !== sid) {
    socket.emit('error', { message: 'Solo el host puede iniciar el juego' });
    return;
  }

  const allReady = lobby.players.every((p) => p.ready || p.is_host);

  if (!allReady) {
    socket.emit('error', { message: 'No todos los jugadores están listos' });
    return;
  }

  lobby.status = 'playing';
  lobby.win_score = 10000;

  for (const player of lobby.players) {
    player.score = 0;
  }

  questionQueue[lobbyId] = [];

  console.log(`Generando primera pregunta para el lobby ${lobbyId}...`);
  const firstQuestion = await generateSingleQuestionSync();

  if (!firstQuestion) {
    socket.emit('error', { message: 'Error generando pregunta inicial' });
    return;
  }

  activeQuestions[lobbyId] = {
    current_question: firstQuestion,
    question_number: 1
  };

  startQuestionGenerator(lobbyId);

  io.to(lobbyId).emit('game_started', {
    lobby,
    win_score: 10000,
    message: '¡Primero en llegar a 10,000 puntos gana!'
  });

  io.to(lobbyId).emit('lobby_updated', { lobby });

  setTimeout(() => {
    sendNextQuestion(io, lobbyId);
  }, 2000);
};

// submit_answer
const handleSubmitAnswer = (io, socket, data) => {
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

  if (playerAnswers[lobbyId] && playerAnswers[lobbyId].answers[sid]) {
    socket.emit('error', { message: 'Ya respondiste esta pregunta' });
    return;
  }

  const answerIndex = data?.answer_index;
  const answerTime = Date.now();

  const startTime = playerAnswers[lobbyId].start_time;
  const responseTime = (answerTime - startTime) / 1000;

  const correctAnswer = playerAnswers[lobbyId].correct_answer;
  const isCorrect = answerIndex === correctAnswer;

  let points = 0;
  if (isCorrect) {
    const timeBonus = Math.max(0, 500 - Math.floor(responseTime * 20));
    points = 1000 + timeBonus;
  }

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

  playerAnswers[lobbyId].answers[sid] = {
    answer_index: answerIndex,
    is_correct: isCorrect,
    points,
    response_time: responseTime
  };

  socket.emit('answer_result', {
    is_correct: isCorrect,
    points,
    total_score: playerScore,
    correct_answer: correctAnswer,
    explanation: currentQuestion.explanation || ''
  });

  io.to(lobbyId).emit('player_answered', {
    player_name: playerName,
    total_answered: Object.keys(playerAnswers[lobbyId].answers).length,
    total_players: lobby.players.length
  });

  io.to(lobbyId).emit('lobby_updated', { lobby });

  if (playerScore >= lobby.win_score) {
    console.log(`¡${playerName} ganó con ${playerScore} puntos!`);

    if (questionTimers[lobbyId]) {
      clearTimeout(questionTimers[lobbyId]);
    }

    setTimeout(() => {
      endGame(io, lobbyId);
    }, 2000);
    return;
  }

  if (Object.keys(playerAnswers[lobbyId].answers).length >= lobby.players.length) {
    if (questionTimers[lobbyId]) {
      clearTimeout(questionTimers[lobbyId]);
      console.log('✓ Todos respondieron, cancelando temporizador automático');
    }

    setTimeout(() => {
      const nextQuestion = getNextQuestion(lobbyId);

      if (nextQuestion) {
        activeQuestions[lobbyId].current_question = nextQuestion;
        activeQuestions[lobbyId].question_number += 1;
        sendNextQuestion(io, lobbyId);
      } else {
        console.log('No hay más preguntas disponibles');
        endGame(io, lobbyId);
      }
    }, 3000);
  }
};

// time_up
const handleTimeUp = (io, socket) => {
  const sid = socket.id;

  if (!userLobbies[sid]) {
    return;
  }

  const lobbyId = userLobbies[sid];

  if (!activeQuestions[lobbyId] || !playerAnswers[lobbyId]) {
    return;
  }

  if (!playerAnswers[lobbyId].answers[sid]) {
    playerAnswers[lobbyId].answers[sid] = {
      answer_index: -1,
      is_correct: false,
      points: 0,
      response_time: 30
    };
  }
};

// request_new_round
const handleRequestNewRound = (io, socket) => {
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

  if (lobby.host !== sid) {
    socket.emit('error', { message: 'Solo el host puede iniciar una nueva ronda' });
    return;
  }

  lobby.status = 'waiting_new_round';

  for (const player of lobby.players) {
    if (!player.is_host) {
      player.ready = false;
    }
  }

  console.log(`Nueva ronda solicitada en lobby ${lobbyId}`);

  io.to(lobbyId).emit('waiting_new_round', {
    lobby,
    message: 'Esperando a que todos estén listos para la nueva ronda'
  });
};

// ready_for_new_round
const handleReadyForNewRound = async (io, socket) => {
  const sid = socket.id;

  if (!userLobbies[sid]) {
    socket.emit('error', { message: 'No estás en ningún lobby' });
    return;
  }

  const lobbyId = userLobbies[sid];
  const lobby = lobbies[lobbyId];

  if (!lobby) {
    socket.emit('error', { message: 'Lobby no encontrado' });
    return;
  }

  for (const player of lobby.players) {
    if (player.socket_id === sid) {
      player.ready = true;
      break;
    }
  }

  io.to(lobbyId).emit('player_ready_changed', { lobby });

  const allReady = lobby.players.every((p) => p.ready || p.is_host);

  if (allReady) {
    lobby.status = 'playing';

    for (const player of lobby.players) {
      player.score = 0;
    }

    console.log(`Generando nuevas preguntas para el lobby ${lobbyId}...`);
    const questions = await generateRoundQuestions(5);

    if (!usedQuestionsCache[lobbyId]) {
      usedQuestionsCache[lobbyId] = [];
    }

    for (const q of questions) {
      if (q.question) {
        usedQuestionsCache[lobbyId].push(q.question);
      }
    }

    activeQuestions[lobbyId] = {
      questions,
      current_question_index: 0,
      total_questions: questions.length
    };

    io.to(lobbyId).emit('new_round_started', {
      lobby,
      total_questions: questions.length,
      message: '¡Nueva ronda comenzando!'
    });

    io.to(lobbyId).emit('lobby_updated', { lobby });

    setTimeout(() => {
      sendNextQuestion(io, lobbyId);
    }, 2000);
  }
};

// back_to_lobby
const handleBackToLobby = (io, socket) => {
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

  if (lobby.host !== sid) {
    socket.emit('error', { message: 'Solo el host puede volver al lobby' });
    return;
  }

  lobby.status = 'waiting';

  for (const player of lobby.players) {
    player.score = 0;
    if (!player.is_host) {
      player.ready = false;
    }
  }

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

  io.to(lobbyId).emit('returned_to_lobby', {
    lobby,
    message: 'Volviendo al lobby'
  });
};

module.exports = {
  activeQuestions,
  playerAnswers,
  usedQuestionsCache,
  questionQueue,
  generationThreads,
  questionTimers,
  handleStartGame,
  handleSubmitAnswer,
  handleTimeUp,
  handleRequestNewRound,
  handleReadyForNewRound,
  handleBackToLobby,
  startQuestionGenerator,
  getNextQuestion,
  sendNextQuestion,
  endGame
};