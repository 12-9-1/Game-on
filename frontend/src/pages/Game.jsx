import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Game.css';

function Game({ socket, currentLobby }) {
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [playersAnswered, setPlayersAnswered] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [roundEnded, setRoundEnded] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waitingNewRound, setWaitingNewRound] = useState(false);
  const [lobby, setLobby] = useState(currentLobby);
  const [isHost, setIsHost] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [winScore, setWinScore] = useState(10000);

  useEffect(() => {
    if (!socket || !currentLobby) {
      navigate('/');
      return;
    }

    // Escuchar nueva pregunta
    socket.on('new_question', (data) => {
      console.log('Nueva pregunta recibida:', data);
      setQuestion(data);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setAnswerResult(null);
      setTimeLeft(data.time_limit || 30);
      setPlayersAnswered(0);
      setTotalPlayers(currentLobby.players?.length || 0);
      setLoading(false);
    });

    // Escuchar resultado de respuesta
    socket.on('answer_result', (data) => {
      console.log('Resultado de respuesta:', data);
      setAnswerResult(data);
      if (data.total_score !== undefined) {
        setMyScore(data.total_score);
      }
    });

    // Escuchar cuando un jugador responde
    socket.on('player_answered', (data) => {
      console.log('Jugador respondió:', data);
      setPlayersAnswered(data.total_answered);
      setTotalPlayers(data.total_players);
    });

    // Escuchar fin de ronda
    socket.on('round_ended', (data) => {
      console.log('Ronda terminada:', data);
      setRoundEnded(true);
      setResults(data.results);
      setLoading(false);
    });

    // Escuchar espera de nueva ronda
    socket.on('waiting_new_round', (data) => {
      console.log('Esperando nueva ronda:', data);
      setWaitingNewRound(true);
      setLobby(data.lobby);
      setRoundEnded(false);
      setLoading(false);
    });

    // Escuchar inicio de nueva ronda
    socket.on('new_round_started', (data) => {
      console.log('Nueva ronda iniciada:', data);
      setWaitingNewRound(false);
      setRoundEnded(false);
      setResults([]);
      setLoading(true);
    });

    // Escuchar cambios en estado ready
    socket.on('player_ready_changed', (data) => {
      console.log('Estado ready cambiado:', data);
      setLobby(data.lobby);
    });

    // Escuchar volver al lobby
    socket.on('returned_to_lobby', (data) => {
      console.log('Volviendo al lobby:', data);
      // Resetear todos los estados del juego
      setQuestion(null);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setAnswerResult(null);
      setRoundEnded(false);
      setResults([]);
      setWaitingNewRound(false);
      setLoading(false);
      // Navegar al lobby (la ruta correcta según App.jsx)
      navigate('/');
    });

    return () => {
      socket.off('new_question');
      socket.off('answer_result');
      socket.off('player_answered');
      socket.off('round_ended');
      socket.off('waiting_new_round');
      socket.off('new_round_started');
      socket.off('player_ready_changed');
      socket.off('returned_to_lobby');
    };
  }, [socket, currentLobby, navigate]);

  // Temporizador
  // Determinar si el usuario es host
  useEffect(() => {
    if (!socket || !currentLobby) return;
    const userIsHost = currentLobby.players?.some(
      p => p.socket_id === socket.id && p.is_host
    );
    setIsHost(userIsHost);
  }, [socket, currentLobby]);

  useEffect(() => {
    if (!question || hasAnswered || roundEnded) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [question, hasAnswered, roundEnded]);

  const handleTimeUp = () => {
    if (!hasAnswered && socket) {
      socket.emit('time_up');
      setHasAnswered(true);
    }
  };

  const handleAnswerClick = (index) => {
    if (hasAnswered || !socket) return;

    setSelectedAnswer(index);
    setHasAnswered(true);

    socket.emit('submit_answer', { answer_index: index });
  };

  const handleNewRound = () => {
    if (socket && isHost) {
      socket.emit('request_new_round');
    }
  };

  const handleBackToLobby = () => {
    if (socket && isHost) {
      socket.emit('back_to_lobby');
    }
  };

  const handleReadyForNewRound = () => {
    if (socket) {
      socket.emit('ready_for_new_round');
    }
  };

  const getTimerColor = () => {
    if (timeLeft > 20) return 'var(--teal-light)';
    if (timeLeft > 10) return 'var(--gold-400)';
    return '#ff4444';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'var(--teal-light)';
      case 'medium':
        return 'var(--gold-400)';
      case 'hard':
        return '#ff4444';
      default:
        return 'var(--gold-400)';
    }
  };

  if (loading) {
    return (
      <div className="game-container">
        <div className="loading-game">
          <div className="spinner"></div>
          <p>Generando preguntas...</p>
        </div>
      </div>
    );
  }

  if (waitingNewRound) {
    return (
      <div className="game-container">
        <div className="waiting-room">
          <h1 className="waiting-title">¡Preparando Nueva Ronda!</h1>
          
          <div className="players-ready-list">
            <h3>Estado de los Jugadores:</h3>
            {lobby?.players?.map((player, index) => (
              <div key={index} className={`player-ready-item ${player.ready || player.is_host ? 'ready' : 'not-ready'}`}>
                <span className="player-name">
                  {player.name} {player.is_host && '(Host)'}
                </span>
                <span className="ready-status">
                  {player.is_host ? '✓ Listo' : player.ready ? '✓ Listo' : '⏳ Esperando...'}
                </span>
              </div>
            ))}
          </div>

          {!isHost && (
            <button className="btn-ready-new-round" onClick={handleReadyForNewRound}>
              Marcar como Listo
            </button>
          )}

          {isHost && (
            <p className="host-message">Esperando a que todos estén listos...</p>
          )}
        </div>
      </div>
    );
  }

  if (roundEnded) {
    return (
      <div className="game-container">
        <div className="results-screen">
          <h1 className="results-title">🏆 Resultados Finales</h1>
          
          {results.length > 0 && (
            <div className="winner-card">
              <div className="winner-crown">👑</div>
              <h2>{results[0].name}</h2>
              <p className="winner-score">{results[0].score} puntos</p>
            </div>
          )}

          <div className="results-list">
            {results.map((player, index) => (
              <div 
                key={index} 
                className={`result-item ${index === 0 ? 'first-place' : ''}`}
              >
                <div className="result-rank">#{player.rank}</div>
                <div className="result-name">{player.name}</div>
                <div className="result-score">{player.score} pts</div>
              </div>
            ))}
          </div>

          {isHost ? (
            <div className="results-actions">
              <button className="btn-new-round" onClick={handleNewRound}>
                🔄 Nueva Ronda
              </button>
              <button className="btn-back-lobby" onClick={handleBackToLobby}>
                🏠 Volver al Lobby
              </button>
            </div>
          ) : (
            <p className="waiting-host-message">Esperando decisión del host...</p>
          )}
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="game-container">
        <div className="loading-game">
          <div className="spinner"></div>
          <p>Cargando pregunta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="question-info">
          <span className="question-number">
            Pregunta #{question.question_number}
          </span>
          <span 
            className="difficulty-badge" 
            style={{ backgroundColor: getDifficultyColor(question.difficulty) }}
          >
            {question.difficulty === 'easy' ? 'Fácil' : 
             question.difficulty === 'medium' ? 'Media' : 'Difícil'}
          </span>
          <span className="category-badge">{question.category}</span>
        </div>

        <div className="score-display">
          <div className="my-score">
            <span className="score-label">Tu puntaje:</span>
            <span className="score-value">{myScore.toLocaleString()}</span>
          </div>
          <div className="win-score">
            <span className="score-label">Objetivo:</span>
            <span className="score-value">{winScore.toLocaleString()}</span>
          </div>
        </div>

        <div className="timer" style={{ color: getTimerColor() }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>{timeLeft}s</span>
        </div>
      </div>

      <div className="question-card">
        <h2 className="question-text">{question.question}</h2>

        <div className="options-grid">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = answerResult && index === answerResult.correct_answer;
            const isWrong = answerResult && isSelected && !answerResult.is_correct;

            let className = 'option-button';
            if (hasAnswered) {
              if (isCorrect) className += ' correct';
              else if (isWrong) className += ' wrong';
              else className += ' disabled';
            } else if (isSelected) {
              className += ' selected';
            }

            return (
              <button
                key={index}
                className={className}
                onClick={() => handleAnswerClick(index)}
                disabled={hasAnswered}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="option-text">{option}</span>
                {hasAnswered && isCorrect && <span className="check-mark">✓</span>}
                {hasAnswered && isWrong && <span className="x-mark">✗</span>}
              </button>
            );
          })}
        </div>

        {answerResult && (
          <div className={`answer-feedback ${answerResult.is_correct ? 'correct' : 'incorrect'}`}>
            <div className="feedback-header">
              {answerResult.is_correct ? (
                <>
                  <span className="feedback-icon">✓</span>
                  <span className="feedback-title">¡Correcto!</span>
                  <span className="feedback-points">+{answerResult.points} puntos</span>
                </>
              ) : (
                <>
                  <span className="feedback-icon">✗</span>
                  <span className="feedback-title">Incorrecto</span>
                </>
              )}
            </div>
            {answerResult.explanation && (
              <p className="feedback-explanation">{answerResult.explanation}</p>
            )}
          </div>
        )}

        <div className="players-status">
          <div className="status-bar">
            <div 
              className="status-progress" 
              style={{ width: `${(playersAnswered / totalPlayers) * 100}%` }}
            />
          </div>
          <p className="status-text">
            {playersAnswered} de {totalPlayers} jugadores han respondido
          </p>
        </div>
      </div>
    </div>
  );
}

export default Game;
