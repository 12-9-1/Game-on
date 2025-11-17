import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmModal from "../components/Modals/ConfirmModal";
import "./Lobby.css";

function Lobby({ lobby, socket }) {
  const navigate = useNavigate();
  const [currentLobby, setCurrentLobby] = useState(lobby);
  const [isHost, setIsHost] = useState(false);
  const [mySocketId, setMySocketId] = useState(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    setCurrentLobby(lobby);

    if (socket && lobby) {
      const myId = socket.id;
      setMySocketId(myId);
      const me = lobby.players.find((p) => p.socket_id === myId);
      setIsHost(me?.is_host || false);
    }
  }, [lobby, socket]);

  useEffect(() => {
    if (socket && currentLobby) {
      const myId = socket.id;
      const me = currentLobby.players.find((p) => p.socket_id === myId);
      setIsHost(me?.is_host || false);
    }
  }, [currentLobby, socket]);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerJoined = (data) => {
      setCurrentLobby(data.lobby);

      const newPlayer = data.lobby.players[data.lobby.players.length - 1];
      if (newPlayer.socket_id !== socket.id) {
        toast.info(`🎮 ${newPlayer.name} se unió al lobby`, {
          autoClose: 3000,
        });
      }
    };

    const handlePlayerLeft = (data) => {
      const previousPlayers = currentLobby?.players || [];
      const currentPlayers = data.lobby.players;

      const leftPlayer = previousPlayers.find(
        (p) => !currentPlayers.some((cp) => cp.socket_id === p.socket_id)
      );

      if (leftPlayer && leftPlayer.socket_id !== socket.id) {
        toast.warning(`👋 ${leftPlayer.name} abandonó el lobby`, {
          autoClose: 3000,
        });
      }

      setCurrentLobby(data.lobby);
    };

    const handlePlayerReadyChanged = (data) => {
      const updatedPlayer = data.lobby.players.find(
        (p) =>
          p.socket_id !== socket.id &&
          currentLobby?.players.find((cp) => cp.socket_id === p.socket_id)
            ?.ready !== p.ready
      );

      if (updatedPlayer) {
        if (updatedPlayer.ready) {
          toast.success(`${updatedPlayer.name} está listo`, {
            autoClose: 2000,
          });
        } else {
          toast.info(`⏳ ${updatedPlayer.name} ya no está listo`, {
            autoClose: 2000,
          });
        }
      }

      setCurrentLobby(data.lobby);
    };

    const handleGameStarted = (data) => {
      console.log("Juego iniciado, generando preguntas...");
      setIsGeneratingQuestions(true);

      toast.success("🚀 ¡El juego está comenzando!", {
        autoClose: 2000,
      });
    };

    const handleLobbyClosed = (data) => {
      toast.error(data.message || "❌ El lobby ha sido cerrado", {
        autoClose: 4000,
      });

      setTimeout(() => {
        navigate("/");
      }, 1000);
    };

    socket.on("player_joined", handlePlayerJoined);
    socket.on("player_left", handlePlayerLeft);
    socket.on("player_ready_changed", handlePlayerReadyChanged);
    socket.on("game_started", handleGameStarted);
    socket.on("lobby_closed", handleLobbyClosed);

    return () => {
      socket.off("player_joined", handlePlayerJoined);
      socket.off("player_left", handlePlayerLeft);
      socket.off("player_ready_changed", handlePlayerReadyChanged);
      socket.off("game_started", handleGameStarted);
      socket.off("lobby_closed", handleLobbyClosed);
    };
  }, [socket, navigate, currentLobby]);

  const handleToggleReady = () => {
    if (socket) {
      const willBeReady = !myPlayer?.ready;
      socket.emit("toggle_ready");

      if (willBeReady) {
        toast.success("Marcado como listo", {
          autoClose: 2000,
        });
      } else {
        toast.info("⏳ Ya no estás listo", {
          autoClose: 2000,
        });
      }
    }
  };

  const handleStartGame = () => {
    if (socket && allPlayersReady && !isGeneratingQuestions) {
      if (currentLobby?.players.length < 2) {
        toast.error("⚠️ Se necesitan al menos 2 jugadores para iniciar", {
          autoClose: 3000,
        });
        return;
      }

      setIsGeneratingQuestions(true);
      socket.emit("start_game");

      toast.info("⏳ Iniciando juego y generando preguntas...", {
        autoClose: 2000,
      });
    } else if (!allPlayersReady) {
      toast.warning("⚠️ Todos los jugadores deben estar listos", {
        autoClose: 3000,
      });
    }
  };

  const handleLeaveLobbyClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmLeaveLobby = () => {
    setShowConfirmModal(false);

    if (socket) {
      socket.emit("leave_lobby");
    }

    toast.info("👋 Saliendo del lobby...", {
      autoClose: 1500,
    });

    navigate("/");
  };

  const handleCancelLeave = () => {
    setShowConfirmModal(false);
  };

  const copyLobbyCode = () => {
    navigator.clipboard
      .writeText(currentLobby.id)
      .then(() => {
        toast.success("📋 ¡Código copiado al portapapeles!", {
          autoClose: 2000,
        });
      })
      .catch(() => {
        toast.error("❌ Error al copiar el código", {
          autoClose: 2000,
        });
      });
  };

  const allPlayersReady =
    currentLobby?.players.every((p) => p.ready || p.is_host) || false;
  const myPlayer = currentLobby?.players.find(
    (p) => p.socket_id === mySocketId
  );

  return (
    <div className="lobby-container">
      <ConfirmModal
        isOpen={showConfirmModal}
        title="⚠️ Abandonar Lobby"
        message="¿Estás seguro de que quieres abandonar el lobby?"
        confirmText="Sí, abandonar"
        cancelText="Volver"
        onConfirm={handleConfirmLeaveLobby}
        onCancel={handleCancelLeave}
        isDangerous={true}
      />

      <div className="lobby-header">
        <div className="lobby-title-section">
          <h1>🎮 Lobby #{currentLobby?.id}</h1>
          <button className="btn-copy-code" onClick={copyLobbyCode}>
            📋 Copiar Código
          </button>
        </div>
        <button className="btn-leave" onClick={handleLeaveLobbyClick}>
          ← Salir
        </button>
      </div>

      <div className="lobby-content">
        <div className="players-section">
          <div className="section-header">
            <h2>
              Jugadores ({currentLobby?.players.length}/
              {currentLobby?.max_players})
            </h2>
          </div>

          <div className="players-grid">
            {currentLobby?.players.map((player, index) => (
              <div
                key={player.socket_id}
                className={`player-card ${
                  player.socket_id === mySocketId ? "my-player" : ""
                }`}
              >
                <div className="player-avatar">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="player-info">
                  <div className="player-name">
                    {player.name}
                    {player.socket_id === mySocketId && " (Tú)"}
                  </div>
                  <div className="player-badges">
                    {player.is_host && (
                      <span className="badge badge-host">👑 Host</span>
                    )}
                    {player.ready && !player.is_host && (
                      <span className="badge badge-ready">✓ Listo</span>
                    )}
                    {!player.ready && !player.is_host && (
                      <span className="badge badge-waiting">⏳ Esperando</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {Array.from({
              length: currentLobby?.max_players - currentLobby?.players.length,
            }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="player-card player-card-empty"
              >
                <div className="player-avatar player-avatar-empty">?</div>
                <div className="player-info">
                  <div className="player-name">Esperando jugador...</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lobby-actions">
          {!isHost && (
            <button
              className={`btn-ready ${
                myPlayer?.ready ? "btn-ready-active" : ""
              }`}
              onClick={handleToggleReady}
            >
              {myPlayer?.ready ? "✓ Listo" : "⏳ Marcar como Listo"}
            </button>
          )}

          {isHost && (
            <div className="host-actions">
              <button
                className="btn-start-game"
                onClick={handleStartGame}
                disabled={
                  !allPlayersReady ||
                  currentLobby?.players.length < 2 ||
                  isGeneratingQuestions
                }
              >
                {isGeneratingQuestions ? (
                  <>
                    <span className="spinner-small"></span>
                    Generando preguntas...
                  </>
                ) : (
                  <>🚀 Iniciar Juego</>
                )}
              </button>
              {!allPlayersReady && currentLobby?.players.length >= 2 && (
                <p className="warning-text">
                  ⚠️ Todos los jugadores deben estar listos
                </p>
              )}
              {currentLobby?.players.length < 2 && (
                <p className="warning-text">
                  ⚠️ Se necesitan al menos 2 jugadores
                </p>
              )}
            </div>
          )}
        </div>

        <div className="lobby-info-panel">
          <h3>ℹ️ Información</h3>
          <div className="info-grid">
            <div className="info-box">
              <span className="info-icon">🎯</span>
              <div>
                <div className="info-title">Estado</div>
                <div className="info-value">Esperando jugadores</div>
              </div>
            </div>
            <div className="info-box">
              <span className="info-icon">👥</span>
              <div>
                <div className="info-title">Capacidad</div>
                <div className="info-value">
                  {currentLobby?.players.length}/{currentLobby?.max_players}
                </div>
              </div>
            </div>
            <div className="info-box">
              <span className="info-icon">🔗</span>
              <div>
                <div className="info-title">Código</div>
                <div className="info-value">{currentLobby?.id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
