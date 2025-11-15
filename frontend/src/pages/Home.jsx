import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import JoinNameModal from '../components/JoinNameModal';
import { SiApplearcade } from "react-icons/si";
import './Home.css';

function Home({ socket, lobbies, onCreateLobby, onJoinLobby }) {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [joinLobbyId, setJoinLobbyId] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showQuickJoinModal, setShowQuickJoinModal] = useState(false);
  const [quickJoinLobbyId, setQuickJoinLobbyId] = useState('');
  const { user } = useAuth();

  // Establecer el nombre del usuario autenticado por defecto
  useEffect(() => {
    if (user && user.name) {
      setPlayerName(user.name);
    }
  }, [user]);

  const handleCreateLobby = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      onCreateLobby({ 
        player_name: playerName, 
        max_players: maxPlayers,
        public_id: user?.public_id || null
      });
      setShowCreateForm(false);
      setPlayerName('');
    }
  };

  const handleJoinLobby = (e) => {
    e.preventDefault();
    if (playerName.trim() && joinLobbyId.trim()) {
      onJoinLobby({ 
        lobby_id: joinLobbyId, 
        player_name: playerName,
        public_id: user?.public_id || null
      });
      setShowJoinForm(false);
      setPlayerName('');
      setJoinLobbyId('');
    }
  };

  const handleQuickJoin = (lobbyId) => {
    setQuickJoinLobbyId(lobbyId);
    setShowQuickJoinModal(true);
  };

  const handleQuickJoinSubmit = (name) => {
    onJoinLobby({ 
      lobby_id: quickJoinLobbyId, 
      player_name: name,
      public_id: user?.public_id || null
    });
    setShowQuickJoinModal(false);
    setQuickJoinLobbyId('');
  };

  return (
    <div className="home-container">
      <div className="home-header">
        
        
        <h1> <SiApplearcade size={50}/>Battle Quiz Arena - Lobbies</h1>
        <p className="subtitle">Únete a una partida o crea la tuya</p>
      </div>

      <div className="action-buttons">
        <button 
          className="btn-primary"
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setShowJoinForm(false);
          }}
        >
          ➕ Crear Lobby
        </button>
        <button 
          className="btn-secondary"
          onClick={() => {
            setShowJoinForm(!showJoinForm);
            setShowCreateForm(false);
          }}
        >
          🔗 Unirse con Código
        </button>
      </div>

      {showCreateForm && (
        <div className="form-card">
          <h3>Crear Nuevo Lobby</h3>
          <form onSubmit={handleCreateLobby}>
            <div className="form-group">
              <label>Tu Nombre</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ingresa tu nombre"
                required
              />
            </div>
            <div className="form-group">
              <label>Máximo de Jugadores</label>
              <select 
                value={maxPlayers} 
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
              >
                <option value={2}>2 Jugadores</option>
                <option value={4}>4 Jugadores</option>
                <option value={6}>6 Jugadores</option>
                <option value={8}>8 Jugadores</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Crear</button>
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => setShowCreateForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {showJoinForm && (
        <div className="form-card">
          <h3>Unirse a Lobby</h3>
          <form onSubmit={handleJoinLobby}>
            <div className="form-group">
              <label>Tu Nombre</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ingresa tu nombre"
                required
              />
            </div>
            <div className="form-group">
              <label>Código del Lobby</label>
              <input
                type="text"
                value={joinLobbyId}
                onChange={(e) => setJoinLobbyId(e.target.value.toUpperCase())}
                placeholder="Ej: ABC123"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Unirse</button>
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => setShowJoinForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="lobbies-section">
        <h2>Lobbies Disponibles</h2>
        {lobbies.length === 0 ? (
          <div className="empty-state">
            <p>🎯 No hay lobbies disponibles</p>
            <p className="empty-subtitle">¡Crea uno nuevo para empezar!</p>
          </div>
        ) : (
          <div className="lobbies-grid">
            {lobbies.map((lobby) => (
              <div key={lobby.id} className="lobby-card">
                <div className="lobby-card-header">
                  <h3>Lobby #{lobby.id}</h3>
                  <span className="lobby-status">🟢 Esperando</span>
                </div>
                <div className="lobby-info">
                  <div className="info-item">
                    <span className="info-label">Host:</span>
                    <span className="info-value">{lobby.host_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Jugadores:</span>
                    <span className="info-value">
                      {lobby.player_count}/{lobby.max_players}
                    </span>
                  </div>
                </div>
                <button 
                  className="btn-join"
                  onClick={() => handleQuickJoin(lobby.id)}
                  disabled={lobby.player_count >= lobby.max_players}
                >
                  {lobby.player_count >= lobby.max_players ? '🔒 Lleno' : '🚀 Unirse'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <JoinNameModal 
        isOpen={showQuickJoinModal}
        onClose={() => setShowQuickJoinModal(false)}
        onSubmit={handleQuickJoinSubmit}
        lobbyId={quickJoinLobbyId}
      />
    </div>
  );
}

export default Home;
