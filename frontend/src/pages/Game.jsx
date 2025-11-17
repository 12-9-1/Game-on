import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useConfirmModal } from "../contexts/ConfirmModalContext";
import PowersPanel from "../components/PowersPanel";
import GameSidebar from "../components/GameSidebar";
import "./Game.css";

function Game({ socket, currentLobby }) {
  const navigate = useNavigate();
  const { showConfirm } = useConfirmModal();

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
  const [winScore, setWinScore] = useState(1000);
  const mySocketId = socket?.id || null;
  const timerRef = useRef(null);
  const [roundResults, setRoundResults] = useState(null);
  const [roundEnded, setRoundEnded] = useState(false);
  const [playersReady, setPlayersReady] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const onNewQuestion = (payload) => {
      setQuestion(payload || null);
      setHiddenOptions([]);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setAnswerResult(null);
      setPlayersAnswered(payload.players_answered || 0);
      setTotalPlayers(payload.total_players || 0);
      setPowers(payload.powers || []);
      setLoading(false);
      setTimeLeft(payload.time_limit || 30);

      console.log("New question received:", payload);
    };

    const onPowerUsed = (payload) => {
      if (!payload || !payload.effect) return;
      const eff = payload.effect;

      if (typeof payload.new_points === "number") {
        setMyScore(payload.new_points);
      }

      if (eff.type === "fifty_fifty" && typeof eff.correct_index === "number") {
        const correct = eff.correct_index;
        const incorrect = [];
        if (question?.options) {
          question.options.forEach((_, i) => {
            if (i !== correct) incorrect.push(i);
          });
        }
        let hide = [...incorrect];
        if (hide.length > 1) {
          const keep = Math.floor(Math.random() * hide.length);
          hide.splice(keep, 1);
        }
        setHiddenOptions(hide);
      } else if (eff.type === "time_boost") {
        setTimeLeft((t) => Math.max(0, t + (eff.added_time || 10)));
      }
    };

    const onLobbyUpdated = (payload) => {
      console.log("Lobby updated:", payload);
      setLobby(payload.lobby || lobby);

      if (payload.my_score != null) {
        console.log("Updating score from lobby update:", payload.my_score);
        setMyScore(payload.my_score);
      } else if (payload.lobby?.players && mySocketId) {
        const currentPlayer = payload.lobby.players.find(
          (p) => p.socket_id === mySocketId
        );
        if (currentPlayer && currentPlayer.score !== undefined) {
          console.log("Updating score from player data:", currentPlayer.score);
          setMyScore(currentPlayer.score);
        }
      }
    };

    const onAnswerResult = (payload) => {
      console.log("Answer result received:", payload);
      setAnswerResult(payload || null);
      setHasAnswered(true);

      if (payload && typeof payload.total_score === "number") {
        console.log("Updating player score to:", payload.total_score);
        setMyScore(payload.total_score);
      }
    };

    const onGameStarted = (payload) => {
      console.log("Game started:", payload);
      setLoading(false);
      if (payload) {
        if (payload.lobby) setLobby(payload.lobby);
        if (payload.win_score) setWinScore(payload.win_score);
      }
    };

    const onRoundEnded = (payload) => {
      console.log("Round ended:", payload);
      setRoundResults(payload || null);
      setRoundEnded(true);
      setQuestion(null);
      setHasAnswered(false);
      setAnswerResult(null);
      setTimeLeft(0);
      clearInterval(timerRef.current);
    };

    const onPlayerReadyChanged = (payload) => {
      console.log("Player ready changed:", payload);
      setLobby(payload.lobby || lobby);
      if (payload.lobby?.players) {
        setPlayersReady(
          payload.lobby.players.map((p) => ({
            socket_id: p.socket_id,
            name: p.name,
            ready: !!p.ready,
            is_host: !!p.is_host,
          }))
        );
      }
    };

    const onNewRoundStarted = (payload) => {
      console.log("New round started:", payload);
      setRoundEnded(false);
      setRoundResults(null);
      setLoading(false);
      if (payload?.lobby) setLobby(payload.lobby);
    };

    socket.on("new_question", onNewQuestion);
    socket.on("power_used", onPowerUsed);
    socket.on("lobby_updated", onLobbyUpdated);
    socket.on("answer_result", onAnswerResult);
    socket.on("game_started", onGameStarted);
    socket.on("round_ended", onRoundEnded);
    socket.on("player_ready_changed", onPlayerReadyChanged);
    socket.on("new_round_started", onNewRoundStarted);

    return () => {
      socket.off("new_question", onNewQuestion);
      socket.off("power_used", onPowerUsed);
      socket.off("lobby_updated", onLobbyUpdated);
      socket.off("answer_result", onAnswerResult);
      socket.off("game_started", onGameStarted);
      socket.off("round_ended", onRoundEnded);
      socket.off("player_ready_changed", onPlayerReadyChanged);
      socket.off("new_round_started", onNewRoundStarted);
    };
  }, [socket, question, mySocketId, lobby]);

  useEffect(() => {
    if (!question || !socket) return;

    clearInterval(timerRef.current);

    const timerId = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerId);
          socket.emit("time_up");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    timerRef.current = timerId;

    return () => {
      clearInterval(timerId);
    };
  }, [question, socket]);

  const handleAnswerClick = (index) => {
    if (!socket || hasAnswered) return;
    setSelectedAnswer(index);
    socket.emit("submit_answer", { answer_index: index });

    console.log("Answer submitted:", { answer_index: index });
  };

  const handlePowerUsed = (powerType) => {
    if (!socket) return;
    console.log("Using power:", powerType, "with score:", myScore);
    socket.emit("use_power", {
      power_type: powerType,
      current_points: myScore,
    });
  };

  const handleReadyForNewRound = () => {
    if (!socket) return;
    socket.emit("ready_for_new_round");
  };

  const handleBackToLobby = async () => {
    const confirmed = await showConfirm({
      title: "Volver al Lobby",
      message:
        "¿Estás seguro que deseas volver al lobby? Se finalizará la partida actual.",
      confirmText: "Sí, volver",
      cancelText: "Cancelar",
      isDangerous: true,
      onConfirm: () => {
        if (!socket) return;
        socket.emit("back_to_lobby");
      },
    });
  };

  const getTimerColor = () => {
    if (timeLeft > 20) return "var(--teal-light)";
    if (timeLeft > 10) return "var(--gold-400)";
    return "#ff4444";
  };

  if (roundEnded && roundResults) {
    if (roundResults.solo_player) {
      return (
        <div className="game-container">
          <div className="results-screen">
            <h1 className="results-title">Partida finalizada</h1>
            <p className="solo-player-message">
              Los demás jugadores se han desconectado. La partida ha terminado.
            </p>
            <div className="results-actions">
              <button className="btn-back-lobby" onClick={handleBackToLobby}>
                Volver al lobby
              </button>
            </div>
          </div>
        </div>
      );
    }

    const totalNonHost = (lobby?.players || []).filter(
      (p) => !p.is_host
    ).length;
    const readyNonHost = (lobby?.players || []).filter(
      (p) => !p.is_host && p.ready
    ).length;
    const isSoloPlayer = (lobby?.players || []).length === 1;

    return (
      <div className="game-container">
        <div className="results-screen">
          <h1 className="results-title">¡Ronda terminada!</h1>

          {roundResults.winner && (
            <div className="winner-card">
              <div className="winner-crown">👑</div>
              <h2>{roundResults.winner.name}</h2>
              <p className="winner-score">
                {(roundResults.winner.score || 0).toLocaleString()} pts
              </p>
            </div>
          )}

          <div className="results-list">
            {roundResults.results?.map((r, idx) => (
              <div
                key={`${r.name}-${idx}`}
                className={`result-item ${idx === 0 ? "first-place" : ""}`}
              >
                <div className="result-rank">{idx + 1}</div>
                <div className="result-name">{r.name}</div>
                <div className="result-score">
                  {(r.score || 0).toLocaleString()} pts
                </div>
              </div>
            ))}
          </div>

          <div className="results-actions">
            {!isSoloPlayer && (
              <button
                className="btn-new-round"
                onClick={handleReadyForNewRound}
              >
                Listo para nueva ronda
              </button>
            )}
            {lobby?.host === mySocketId && (
              <button className="btn-back-lobby" onClick={handleBackToLobby}>
                Volver al lobby
              </button>
            )}
          </div>

          {!isSoloPlayer && (
            <div className="ready-waiting">
              <div className="ready-counter">
                {readyNonHost}/{totalNonHost} listos
              </div>
              <div className="spinner" />
              <p className="waiting-host-message">
                Esperando jugadores listos...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="game-container">
        <div className="loading-game">
          <div className="spinner" />
          <p>Generando preguntas...</p>
        </div>
      </div>
    );

  if (!question)
    return (
      <div className="game-container">
        <div className="loading-game">
          <div className="spinner" />
          <p>Cargando pregunta...</p>
        </div>
      </div>
    );

  return (
    <div className="game-container">
      <div className="game-layout">
        <div className="game-main">
          <div className="game-header">
            <div className="question-info">
              <span className="question-number">
                Pregunta #{question.question_number}
              </span>
              <span
                className="difficulty-badge"
                style={{
                  backgroundColor: getDifficultyColor(question.difficulty),
                }}
              >
                {question.difficulty === "easy"
                  ? "Fácil"
                  : question.difficulty === "medium"
                  ? "Media"
                  : "Difícil"}
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
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{timeLeft}s</span>
            </div>
          </div>

          <div className="question-card">
            <h2 className="question-text">
              {question?.question || "Cargando pregunta..."}
            </h2>

            <div className="options-grid">
              {!question?.options ? (
                <div className="loading-options">Cargando opciones...</div>
              ) : (
                question.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect =
                    answerResult && index === answerResult.correct_answer;
                  const isWrong =
                    answerResult && isSelected && !answerResult.is_correct;
                  const isHidden =
                    hiddenOptions && hiddenOptions.includes(index);

                  let className = "option-button";
                  if (isHidden) className += " hidden";
                  if (hasAnswered) {
                    if (isCorrect) className += " correct";
                    else if (isWrong) className += " wrong";
                    else className += " disabled";
                  } else if (isSelected) className += " selected";

                  if (isHidden) return null;

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
                      {hasAnswered && isCorrect && (
                        <span className="check-mark">✓</span>
                      )}
                      {hasAnswered && isWrong && (
                        <span className="x-mark">✗</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {answerResult && (
              <div
                className={`answer-feedback ${
                  answerResult.is_correct ? "correct" : "incorrect"
                }`}
              >
                <div className="feedback-header">
                  {answerResult.is_correct ? (
                    <>
                      <span className="feedback-icon">✓</span>
                      <span className="feedback-title">¡Correcto!</span>
                      <span className="feedback-points">
                        +{answerResult.points} puntos
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="feedback-icon">✗</span>
                      <span className="feedback-title">Incorrecto</span>
                    </>
                  )}
                </div>
                {answerResult.explanation && (
                  <p className="feedback-explanation">
                    {answerResult.explanation}
                  </p>
                )}
              </div>
            )}

            <div className="players-status">
              <div className="status-bar">
                <div
                  className="status-progress"
                  style={{
                    width: `${
                      (playersAnswered / Math.max(1, totalPlayers)) * 100
                    }%`,
                  }}
                />
              </div>
              <p className="status-text">
                {playersAnswered} de {totalPlayers} jugadores han respondido
              </p>
            </div>
          </div>
        </div>

        <div className="game-sidebar-container">
          <PowersPanel
            powers={powers}
            playerPoints={myScore}
            onPowerUsed={handlePowerUsed}
            disabled={hasAnswered}
          />
          <GameSidebar socket={socket} lobby={lobby} mySocketId={mySocketId} />
        </div>
      </div>
    </div>
  );
}

export default Game;

function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case "easy":
      return "var(--teal-light)";
    case "medium":
      return "var(--gold-400)";
    case "hard":
      return "#ff4444";
    default:
      return "var(--gold-400)";
  }
}
