import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGamepad, FaCopy, FaCrown, FaCheck, FaClock, FaRocket, FaExclamationTriangle, FaInfoCircle, FaUsers, FaLink, FaFlag } from 'react-icons/fa';
import './Lobby.css';

function Lobby({ lobby, socket }) {
  const navigate = useNavigate();
  const [currentLobby, setCurrentLobby] = useState(lobby);
  const [isHost, setIsHost] = useState(false);
  const [mySocketId, setMySocketId] = useState(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  useEffect(() => {
    setCurrentLobby(lobby);
    
    // Determinar si soy el host
    if (socket && lobby) {
      const myId = socket.id;
      setMySocketId(myId);
      const me = lobby.players.find(p => p.socket_id === myId);
      setIsHost(me?.is_host || false);
    }
  }, [lobby, socket]);

  // Actualizar isHost cuando currentLobby cambia (por eventos de socket)
  useEffect(() => {
    if (socket && currentLobby) {
      const myId = socket.id;
      const me = currentLobby.players.find(p => p.socket_id === myId);
      setIsHost(me?.is_host || false);
    }
  }, [currentLobby, socket]);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerJoined = (data) => {
      setCurrentLobby(data.lobby);
    };

    const handlePlayerLeft = (data) => {
      setCurrentLobby(data.lobby);
    };

    const handlePlayerReadyChanged = (data) => {
      setCurrentLobby(data.lobby);
    };

    const handleGameStarted = (data) => {
      console.log('Juego iniciado, generando preguntas...');
      setIsGeneratingQuestions(true);
    };

    const handleLobbyClosed = (data) => {
      alert(data.message || 'El lobby ha sido cerrado');
      navigate('/');
    };

    socket.on('player_joined', handlePlayerJoined);
    socket.on('player_left', handlePlayerLeft);
    socket.on('player_ready_changed', handlePlayerReadyChanged);
    socket.on('game_started', handleGameStarted);
    socket.on('lobby_closed', handleLobbyClosed);

    return () => {
      socket.off('player_joined', handlePlayerJoined);
      socket.off('player_left', handlePlayerLeft);
      socket.off('player_ready_changed', handlePlayerReadyChanged);
      socket.off('game_started', handleGameStarted);
      socket.off('lobby_closed', handleLobbyClosed);
    };
  }, [socket, navigate]);

  const handleToggleReady = () => {
    if (socket) {
      socket.emit('toggle_ready');
    }
  };

  const handleStartGame = () => {
    if (socket && allPlayersReady && !isGeneratingQuestions) {
      setIsGeneratingQuestions(true);
      socket.emit('start_game');
    }
  };

  const handleLeaveLobby = () => {
    if (socket) {
      socket.emit('leave_lobby');
    }
    navigate('/');
  };

  const copyLobbyCode = () => {
    navigator.clipboard.writeText(currentLobby.id);
    alert('¡Código copiado al portapapeles!');
  };

  const allPlayersReady = currentLobby?.players.every(p => p.ready || p.is_host) || false;
  const myPlayer = currentLobby?.players.find(p => p.socket_id === mySocketId);

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <div className="lobby-title-section">
          <h1><FaGamepad /> Lobby #{currentLobby?.id}</h1>
          <button className="btn-copy-code" onClick={copyLobbyCode}>
            <FaCopy /> Copiar Código
          </button>
        </div>
        <button className="btn-leave" onClick={handleLeaveLobby}>
          ← Salir
        </button>
      </div>

      <div className="lobby-content">
        <div className="players-section">
          <div className="section-header">
            <h2>Jugadores ({currentLobby?.players.length}/{currentLobby?.max_players})</h2>
          </div>
          
          <div className="players-grid">
            {currentLobby?.players.map((player, index) => (
              <div 
                key={player.socket_id} 
                className={`player-card ${player.socket_id === mySocketId ? 'my-player' : ''}`}
              >
                <div className="player-avatar">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="player-info">
                  <div className="player-name">
                    {player.name}
                    {player.socket_id === mySocketId && ' (Tú)'}
                  </div>
                  <div className="player-badges">
                    {player.is_host && (
                      <span className="badge badge-host"><FaCrown /> Host</span>
                    )}
                    {player.ready && !player.is_host && (
                      <span className="badge badge-ready"><FaCheck /> Listo</span>
                    )}
                    {!player.ready && !player.is_host && (
                      <span className="badge badge-waiting"><FaClock /> Esperando</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Slots vacíos */}
            {Array.from({ length: currentLobby?.max_players - currentLobby?.players.length }).map((_, index) => (
              <div key={`empty-${index}`} className="player-card player-card-empty">
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
              className={`btn-ready ${myPlayer?.ready ? 'btn-ready-active' : ''}`}
              onClick={handleToggleReady}
            >
              {myPlayer?.ready ? <><FaCheck /> Listo</> : <><FaClock /> Marcar como Listo</>}
            </button>
          )}
          
          {isHost && (
            <div className="host-actions">
              <button 
                className="btn-start-game"
                onClick={handleStartGame}
                disabled={!allPlayersReady || currentLobby?.players.length < 2 || isGeneratingQuestions}
              >
                {isGeneratingQuestions ? (
                  <>
                    <span className="spinner-small"></span>
                    Generando preguntas...
                  </>
                ) : (
                  <><FaRocket /> Iniciar Juego</>
                )}
              </button>
              {!allPlayersReady && currentLobby?.players.length >= 2 && (
                <p className="warning-text">
                  <FaExclamationTriangle /> Todos los jugadores deben estar listos
                </p>
              )}
              {currentLobby?.players.length < 2 && (
                <p className="warning-text">
                  <FaExclamationTriangle /> Se necesitan al menos 2 jugadores
                </p>
              )}
            </div>
          )}
        </div>

        <div className="lobby-info-panel">
          <h3><FaInfoCircle /> Información</h3>
          <div className="info-grid">
            <div className="info-box">
              <span className="info-icon"><FaFlag /></span>
              <div>
                <div className="info-title">Estado</div>
                <div className="info-value">Esperando jugadores</div>
              </div>
            </div>
            <div className="info-box">
              <span className="info-icon"><FaUsers /></span>
              <div>
                <div className="info-title">Capacidad</div>
                <div className="info-value">
                  {currentLobby?.players.length}/{currentLobby?.max_players}
                </div>
              </div>
            </div>
            <div className="info-box">
              <span className="info-icon"><FaLink /></span>
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
