import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import './Home.css';

function Home({ socket, lobbies, onCreateLobby, onJoinLobby }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [playerName, setPlayerName] = useState(user?.name || '');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [joinLobbyId, setJoinLobbyId] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateLobby = (e) => {
    e.preventDefault();
    const nameToUse = playerName.trim() || user?.name || 'Jugador';
    if (nameToUse) {
      onCreateLobby({ player_name: nameToUse, max_players: maxPlayers });
      setShowCreateForm(false);
    }
  };

  const handleJoinLobby = (e) => {
    e.preventDefault();
    const nameToUse = playerName.trim() || user?.name || '';
    if (nameToUse && joinLobbyId.trim()) {
      onJoinLobby({ lobby_id: joinLobbyId, player_name: nameToUse });
      setShowJoinForm(false);
      setJoinLobbyId('');
    }
  };

  const handleQuickJoin = (lobbyId) => {
    const defaultName = user?.name || '';
    const name = prompt('Ingresa tu nombre:', defaultName);
    if (name) onJoinLobby({ lobby_id: lobbyId, player_name: name });
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>🎮 Game On - Lobbies</h1>
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
    </div>
  );
}

export default Home;
