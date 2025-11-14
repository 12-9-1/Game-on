
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PowersPanel from '../components/PowersPanel';
import GameSidebar from '../components/GameSidebar';
import './Game.css';

function Game({ socket, currentLobby }) {
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [powers, setPowers] = useState([]);
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [playersAnswered, setPlayersAnswered] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lobby, setLobby] = useState(currentLobby || null);
  const [myScore, setMyScore] = useState(0);
  const mySocketId = socket?.id || null;
  const timerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const onNewQuestion = (payload) => {
      setQuestion(payload.question || null);
      setHiddenOptions([]);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setAnswerResult(null);
      setPlayersAnswered(payload.players_answered || 0);
      setTotalPlayers(payload.total_players || 0);
      setPowers(payload.powers || []);
      setLoading(false);
      setTimeLeft(payload.time_left || 30);
    };

    const onPowerUsed = (payload) => {
      if (!payload || !payload.effect) return;
      const eff = payload.effect;
      if (eff.type === 'fifty_fifty' && typeof eff.correct_index === 'number') {
        // hide all incorrect except one other so only 2 remain (approximate behavior)
        const correct = eff.correct_index;
        const incorrect = [];
        if (question?.options) {
          question.options.forEach((_, i) => { if (i !== correct) incorrect.push(i); });
        }
        // choose one incorrect to remain visible
        let hide = [...incorrect];
        if (hide.length > 1) {
          const keep = Math.floor(Math.random() * hide.length);
          hide.splice(keep, 1);
        }
        setHiddenOptions(hide);
      } else if (eff.type === 'time_extra') {
        setTimeLeft((t) => Math.max(0, t + (eff.seconds || 5)));
      }
    };

    const onLobbyUpdated = (payload) => {
      setLobby(payload.lobby || lobby);
      if (payload.my_score != null) setMyScore(payload.my_score);
    };

    const onAnswerResult = (payload) => {
      setAnswerResult(payload || null);
      setHasAnswered(true);
    };

    socket.on('new_question', onNewQuestion);
    socket.on('power_used', onPowerUsed);
    socket.on('lobby_updated', onLobbyUpdated);
    socket.on('answer_result', onAnswerResult);

    return () => {
      socket.off('new_question', onNewQuestion);
      socket.off('power_used', onPowerUsed);
      socket.off('lobby_updated', onLobbyUpdated);
      socket.off('answer_result', onAnswerResult);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, question]);

  useEffect(() => {
    if (!question) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [question]);

  const handleAnswerClick = (index) => {
    if (!socket || hasAnswered) return;
    setSelectedAnswer(index);
    socket.emit('submit_answer', { answer: index });
  };

  const handlePowerUsed = (powerType) => {
    if (!socket) return;
    socket.emit('use_power', { power_type: powerType }, (response) => {
      if (response && response.success === false) console.warn('Power rejected:', response.reason);
    });
  };

  const getTimerColor = () => {
    if (timeLeft > 20) return 'var(--teal-light)';
    if (timeLeft > 10) return 'var(--gold-400)';
    return '#ff4444';
  };

  if (loading) return (
    <div className="game-container">
      <div className="loading-game"><div className="spinner" /><p>Generando preguntas...</p></div>
    </div>
  );

  if (!question) return (
    <div className="game-container">
      <div className="loading-game"><div className="spinner" /><p>Cargando pregunta...</p></div>
    </div>
  );

  return (
    <div className="game-container">
      <div className="game-layout">
        <div className="game-main">
          <div className="game-header">
            <div className="question-info">
              <span className="question-number">Pregunta #{question.question_number}</span>
              <span className="difficulty-badge" style={{ backgroundColor: getDifficultyColor(question.difficulty) }}>
                {question.difficulty === 'easy' ? 'Fácil' : question.difficulty === 'medium' ? 'Media' : 'Difícil'}
              </span>
              <span className="category-badge">{question.category}</span>
            </div>

            <div className="score-display">
              <div className="my-score"><span className="score-label">Tu puntaje:</span><span className="score-value">{myScore.toLocaleString()}</span></div>
              <div className="win-score"><span className="score-label">Objetivo:</span><span className="score-value">{winScore.toLocaleString()}</span></div>
            </div>

            <div className="timer" style={{ color: getTimerColor() }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" /></svg>
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
                const isHidden = hiddenOptions && hiddenOptions.includes(index);

                let className = 'option-button';
                if (isHidden) className += ' hidden';
                if (hasAnswered) {
                  if (isCorrect) className += ' correct';
                  else if (isWrong) className += ' wrong';
                  else className += ' disabled';
                } else if (isSelected) className += ' selected';

                if (isHidden) return null;

                return (
                  <button key={index} className={className} onClick={() => handleAnswerClick(index)} disabled={hasAnswered}>
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
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
                    <><span className="feedback-icon">✓</span><span className="feedback-title">¡Correcto!</span><span className="feedback-points">+{answerResult.points} puntos</span></>
                  ) : (
                    <><span className="feedback-icon">✗</span><span className="feedback-title">Incorrecto</span></>
                  )}
                </div>
                {answerResult.explanation && <p className="feedback-explanation">{answerResult.explanation}</p>}
              </div>
            )}

            <div className="players-status"><div className="status-bar"><div className="status-progress" style={{ width: `${(playersAnswered / Math.max(1, totalPlayers)) * 100}%` }} /></div>
              <p className="status-text">{playersAnswered} de {totalPlayers} jugadores han respondido</p>
            </div>
          </div>
        </div>

        <div className="game-sidebar-container">
          <PowersPanel powers={powers} playerPoints={myScore} onPowerUsed={handlePowerUsed} disabled={hasAnswered} />
          <GameSidebar socket={socket} lobby={lobby} mySocketId={mySocketId} />
        </div>
      </div>
    </div>
  );
}

export default Game;

// helpers
function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case 'easy': return 'var(--teal-light)';
    case 'medium': return 'var(--gold-400)';
    case 'hard': return '#ff4444';
    default: return 'var(--gold-400)';
  }
}

