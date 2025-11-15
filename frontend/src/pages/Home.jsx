import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import Login from './auth/Login';
import Register from './auth/Register';
import 'react-toastify/dist/ReactToastify.css';
import './Home.css';

function Home({ socket, lobbies, onCreateLobby, onJoinLobby }) {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [joinLobbyId, setJoinLobbyId] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [activeTab, setActiveTab] = useState('anonimo');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    // Reset the tab to 'anonimo' after logout
    setActiveTab('anonimo');
  };

  // Establecer el nombre del usuario autenticado por defecto
  useEffect(() => {
    if (user && user.name) {
      setPlayerName(user.name);
    }
  }, [user]);

  const handleCreateLobby = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      onCreateLobby({ player_name: playerName, max_players: maxPlayers });
      setShowCreateForm(false);
      setPlayerName('');
    }
  };

  const handleJoinLobby = (e) => {
    e.preventDefault();
    if (playerName.trim() && joinLobbyId.trim()) {
      onJoinLobby({ lobby_id: joinLobbyId, player_name: playerName });
      setShowJoinForm(false);
      setPlayerName('');
      setJoinLobbyId('');
    }
  };

  const handleQuickJoin = (lobbyId) => {
    // Si el usuario está autenticado, usar su nombre directamente
    if (user && (user.name || user.email)) {
      const name = user.name || user.email;
      onJoinLobby({ lobby_id: lobbyId, player_name: name });
      return;
    }

    // Modo anónimo:
    // 1) Ir a la pestaña "Anónimo"
    // 2) Abrir el formulario de "Unirse con código"
    // 3) Precargar el código del lobby y dejar que escriba su nombre en el input
    setActiveTab('anonimo');
    setShowCreateForm(false);
    setShowJoinForm(true);
    setJoinLobbyId(lobbyId);

    // Mensaje de ayuda para el usuario anónimo con toast
    toast.info('Estás entrando como invitado. Escribe tu nombre y pulsa "Unirse" para entrar al lobby.', {
      position: 'top-center',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'dark'
    });
  };

  return (
    <div className="home-container">
      <ToastContainer />
      <div className="home-header">
        <h1>🎮 Game On - Lobbies</h1>
        <p className="subtitle">Únete a una partida o crea la tuya</p>
      </div>

      {/* Tabs de navegación */}
      <div className="tabs-container">
        <div className="tabs-header">
          <button 
            className={`tab-button ${activeTab === 'anonimo' ? 'active' : ''}`}
            onClick={() => setActiveTab('anonimo')}
          >
            Anónimo
          </button>
          <button 
            className={`tab-button ${activeTab === 'autenticado' ? 'active' : ''}`}
            onClick={() => setActiveTab('autenticado')}
          >
            Autenticado
          </button>
        </div>

        {/* Contenido de la pestaña Anónimo */}
        {activeTab === 'anonimo' && (
          <div className="tab-content">
            <div className="anon-card">
               <p>Empieza a jugar de forma anónima</p>
              <div className="avatar-section">
                <div className="character-avatar">
                  <span>👤</span>
                  <button className="refresh-button">🔄</button>
                </div>
                <div className="input-section">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Ingresa tu nombre"
                    className="name-input"
                    required
                  />
                
              {showCreateForm ? (
                <div className="lobby-card">
                  <div className="lobby-card-content">
                    <h3>Crear Nuevo Lobby</h3>
                    <form onSubmit={handleCreateLobby}>
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
                </div>
              ) : (
                    <div className="lobby-actions">
                      {showCreateForm ? (
                        <div className="form-card">
                          <h3>Crear Nuevo Lobby</h3>
                          <form onSubmit={handleCreateLobby}>
                            <div className="form-group">
                              <label>Máximo de Jugadores</label>
                              <select 
                                value={maxPlayers} 
                                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                              >
                                <option value={2}>2 Jugadores</option>
                                <option value={3}>3 Jugadores</option>
                                <option value={4}>4 Jugadores</option>
                                <option value={5}>5 Jugadores</option>
                                <option value={6}>6 Jugadores</option>
                                <option value={7}>7 Jugadores</option>
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
                      ) : showJoinForm ? (
                        <div className="form-card">
                          <h3>Unirse a Lobby</h3>
                          <form onSubmit={handleJoinLobby}>
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
                      ) : (
                        <>
                          <button 
                            className="btn-primary"
                            onClick={() => {
                              setShowCreateForm(true);
                              setShowJoinForm(false);
                            }}
                          >
                            ➕ Crear Lobby
                          </button>
                          <button 
                            className="btn-secondary"
                            onClick={() => {
                              setShowJoinForm(true);
                              setShowCreateForm(false);
                            }}
                          >
                            🔗 Unirse con Código
                          </button>
                        </>
                      )}
                    </div>
              )}
              </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido de la pestaña Autenticado */}
        {activeTab === 'autenticado' && (
          <div className="tab-content">
            <div className="user-info">
              {user && (
                <div className="welcome-message">
                  ¡Bienvenido, <span className="username">{user.name || user.email}</span>!
                </div>
              )}
              <div className="avatar-section">
                <div className="character-avatar">
                  <span>👤</span>
                  <button className="refresh-button">🔄</button>
                </div>
              </div>
              <div className="auth-buttons">
                {user ? (
                  <>
                    <button 
                      className="auth-button profile"
                      onClick={() => navigate('/profile')}
                    >
                      Ver Perfil
                    </button>
                    <button 
                      className="auth-button logout"
                      onClick={handleLogout}
                    >
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="auth-button login"
                      onClick={() => setShowLoginModal(true)}
                    >
                      Iniciar Sesión
                    </button>
                    <button 
                      className="auth-button register"
                      onClick={() => setShowRegisterModal(true)}
                    >
                      Registrarse
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <Login onSuccess={() => setShowLoginModal(false)} />
            <button className="close-modal" onClick={() => setShowLoginModal(false)}>×</button>
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <Register onSuccess={() => setShowRegisterModal(false)} />
            <button className="close-modal" onClick={() => setShowRegisterModal(false)}>×</button>
          </div>
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
