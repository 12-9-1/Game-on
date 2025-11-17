import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import Login from "./auth/Login";
import Register from "./auth/Register";
import "react-toastify/dist/ReactToastify.css";
import JoinNameModal from "../components/Modals/JoinNameModal";

// Icons
import { SiApplearcade } from "react-icons/si";
import { TiPlus } from "react-icons/ti";
import { LuPaperclip } from "react-icons/lu";
import { MdMeetingRoom } from "react-icons/md";
import { IoMdLogIn } from "react-icons/io";
import { FaUserPlus, FaUserCircle } from "react-icons/fa";

import "./Home.css";

function Home({ socket, lobbies, onCreateLobby, onJoinLobby }) {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [joinLobbyId, setJoinLobbyId] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [activeTab, setActiveTab] = useState("anonimo");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setActiveTab("anonimo");
    toast.success("Sesión cerrada exitosamente");
  };

  const [showQuickJoinModal, setShowQuickJoinModal] = useState(false);
  const [quickJoinLobbyId, setQuickJoinLobbyId] = useState("");

  const [createErrors, setCreateErrors] = useState({});
  const [joinErrors, setJoinErrors] = useState({});

  useEffect(() => {
    if (user && user.name) {
      setPlayerName(user.name);
      setActiveTab("autenticado");
    } else {
      setActiveTab("anonimo");
    }
  }, [user]);

  const validateCreateForm = () => {
    const errors = {};

    // Solo validar nombre si estamos en modo anónimo
    if (!user) {
      if (!playerName.trim()) {
        errors.playerName = "El nombre es requerido";
        toast.error("Por favor ingresa tu nombre");
      } else if (playerName.trim().length < 2) {
        errors.playerName = "El nombre debe tener al menos 2 caracteres";
        toast.error("El nombre debe tener al menos 2 caracteres");
      } else if (playerName.trim().length > 20) {
        errors.playerName = "El nombre no puede exceder 20 caracteres";
        toast.error("El nombre no puede exceder 20 caracteres");
      }
    }

    return errors;
  };

  const validateJoinForm = () => {
    const errors = {};

    // Solo validar nombre si estamos en modo anónimo
    if (!user) {
      if (!playerName.trim()) {
        errors.playerName = "El nombre es requerido";
        toast.error("Por favor ingresa tu nombre");
      } else if (playerName.trim().length < 2) {
        errors.playerName = "El nombre debe tener al menos 2 caracteres";
        toast.error("El nombre debe tener al menos 2 caracteres");
      } else if (playerName.trim().length > 20) {
        errors.playerName = "El nombre no puede exceder 20 caracteres";
        toast.error("El nombre no puede exceder 20 caracteres");
      }
    }

    if (!joinLobbyId.trim()) {
      errors.lobbyId = "El código del lobby es requerido";
      toast.error("Por favor ingresa el código del lobby");
    } else if (joinLobbyId.trim().length < 3) {
      errors.lobbyId = "El código debe tener al menos 3 caracteres";
      toast.error("El código debe tener al menos 3 caracteres");
    }

    return errors;
  };

  const handleCreateLobby = (e) => {
    e.preventDefault();
    const errors = validateCreateForm();

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setCreateErrors({});
    const name = user ? user.name || user.email : playerName;

    onCreateLobby({
      player_name: name,
      max_players: maxPlayers,
      public_id: user?.public_id || null,
    });

    toast.success("Lobby creado exitosamente");

    setShowCreateForm(false);
    if (!user) setPlayerName("");
  };

  const handleJoinLobby = (e) => {
    e.preventDefault();
    const errors = validateJoinForm();

    if (Object.keys(errors).length > 0) {
      setJoinErrors(errors);
      return;
    }

    setJoinErrors({});
    const name = user ? user.name || user.email : playerName;

    // Normalizar código: sin espacios y en minúsculas
    const normalizedLobbyId = joinLobbyId.trim().toLowerCase();

    onJoinLobby({
      lobby_id: normalizedLobbyId,
      player_name: name,
      public_id: user?.public_id || null,
    });

    toast.success(`Uniéndose al lobby ${joinLobbyId}...`);

    setShowJoinForm(false);
    if (!user) setPlayerName("");
    setJoinLobbyId("");
  };

  const handleQuickJoin = (lobbyId) => {
    // Si el usuario está autenticado, usar su nombre directamente
    if (user && (user.name || user.email)) {
      const name = user.name || user.email;
      onJoinLobby({
        lobby_id: lobbyId,
        player_name: name,
        public_id: user?.public_id || null,
      });

      toast.success(`¡Uniéndose al Lobby #${lobbyId}!`);
      return;
    }

    // Modo anónimo: mostrar modal para que ingrese su nombre
    setQuickJoinLobbyId(lobbyId);
    setShowQuickJoinModal(true);
  };

  const handleQuickJoinSubmit = (name) => {
    onJoinLobby({
      lobby_id: quickJoinLobbyId,
      player_name: name,
      public_id: user?.public_id || null,
    });

    toast.success(`¡Bienvenido ${name}! Uniéndose al lobby...`);

    setShowQuickJoinModal(false);
    setQuickJoinLobbyId("");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowCreateForm(false);
    setShowJoinForm(false);
    setCreateErrors({});
    setJoinErrors({});
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>
          <SiApplearcade className="header-icon" />
          Battle Quiz Arena - Lobbies
        </h1>
        <p className="subtitle">Únete a una partida o crea la tuya</p>
      </div>

      {/* Tabs de navegación: mostrar Anónimo solo si no hay usuario */}
      <div className="tabs-container">
        <div className="tabs-header">
          {!user && (
            <button
              className={`tab-button ${
                activeTab === "anonimo" ? "active" : ""
              }`}
              onClick={() => handleTabChange("anonimo")}
            >
              Anónimo
            </button>
          )}
          <button
            className={`tab-button ${
              activeTab === "autenticado" ? "active" : ""
            }`}
            onClick={() => handleTabChange("autenticado")}
          >
            Autenticado
          </button>
        </div>

        {/* Contenido de la pestaña Anónimo (solo si no está autenticado) */}
        {!user && activeTab === "anonimo" && (
          <div className="tab-content">
            <div className="anon-card">
              <p className="anon-title">Empieza a jugar de forma anónima</p>

              <div className="anon-avatar-wrapper">
                <FaUserCircle className="anon-avatar-icon" />
              </div>

              <div className="avatar-section">
                <div className="input-section">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Ingresa tu nombre"
                    disabled={!!user}
                    className="name-input"
                  />
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="btn-primary"
                  onClick={() => {
                    setShowCreateForm(!showCreateForm);
                    setShowJoinForm(false);
                    setCreateErrors({});
                  }}
                >
                  <TiPlus className="btn-icon" />
                  <span>Crear Lobby</span>
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowJoinForm(!showJoinForm);
                    setShowCreateForm(false);
                    setJoinErrors({});
                  }}
                >
                  <LuPaperclip className="btn-icon" />
                  <span>Unirse con Código</span>
                </button>
              </div>

              {showCreateForm && (
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
                      <button type="submit" className="btn-primary">
                        Crear
                      </button>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => {
                          setShowCreateForm(false);
                          setCreateErrors({});
                        }}
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
                      <label>Código del Lobby</label>
                      <input
                        type="text"
                        value={joinLobbyId}
                        onChange={(e) => {
                          // Mantener el valor tal cual lo escribe el usuario;
                          // se normaliza al enviar.
                          setJoinLobbyId(e.target.value);
                          if (joinErrors.lobbyId) {
                            setJoinErrors({ ...joinErrors, lobbyId: "" });
                          }
                        }}
                        placeholder="Ej: ABC123"
                        className={joinErrors.lobbyId ? "input-error" : ""}
                      />
                      {joinErrors.lobbyId && (
                        <span className="error-message">
                          {joinErrors.lobbyId}
                        </span>
                      )}
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">
                        Unirse
                      </button>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => {
                          setShowJoinForm(false);
                          setJoinErrors({});
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contenido de la pestaña Autenticado */}
        {activeTab === "autenticado" && (
          <div className="tab-content">
            {user ? (
              <div className="user-info">
                <div className="user-header">
                  <div className="user-avatar">
                    <FaUserCircle className="user-avatar-icon" />
                  </div>
                  <div className="welcome-message">
                    ¡Bienvenido,{" "}
                    <span className="username">{user.name || user.email}</span>!
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setShowCreateForm(!showCreateForm);
                      setShowJoinForm(false);
                      setCreateErrors({});
                    }}
                  >
                    <TiPlus className="btn-icon" />
                    <span>Crear Lobby</span>
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowJoinForm(!showJoinForm);
                      setShowCreateForm(false);
                      setJoinErrors({});
                    }}
                  >
                    <LuPaperclip className="btn-icon" />
                    <span>Unirse con Código</span>
                  </button>
                </div>

                {showCreateForm && (
                  <div className="form-card">
                    <h3>Crear Nuevo Lobby</h3>
                    <form onSubmit={handleCreateLobby}>
                      <div className="form-group">
                        <label>Máximo de Jugadores</label>
                        <select
                          value={maxPlayers}
                          onChange={(e) =>
                            setMaxPlayers(Number(e.target.value))
                          }
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
                        <button type="submit" className="btn-primary">
                          Crear
                        </button>
                        <button
                          type="button"
                          className="btn-cancel"
                          onClick={() => {
                            setShowCreateForm(false);
                            setCreateErrors({});
                          }}
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
                        <label>Código del Lobby</label>
                        <input
                          type="text"
                          value={joinLobbyId}
                          onChange={(e) => {
                            // Mantener el valor tal cual lo escribe el usuario;
                            // se normaliza al enviar.
                            setJoinLobbyId(e.target.value);
                            if (joinErrors.lobbyId) {
                              setJoinErrors({ ...joinErrors, lobbyId: "" });
                            }
                          }}
                          placeholder="Ej: ABC123"
                          className={joinErrors.lobbyId ? "input-error" : ""}
                        />
                        {joinErrors.lobbyId && (
                          <span className="error-message">
                            {joinErrors.lobbyId}
                          </span>
                        )}
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn-primary">
                          Unirse
                        </button>
                        <button
                          type="button"
                          className="btn-cancel"
                          onClick={() => {
                            setShowJoinForm(false);
                            setJoinErrors({});
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div className="user-info">
                <p>Inicia sesión para acceder a funciones exclusivas</p>
                <div className="auth-buttons">
                  <button
                    className="auth-button login"
                    onClick={() => setShowLoginModal(true)}
                  >
                    <IoMdLogIn className="btn-icon" /> Iniciar Sesión
                  </button>
                  <button
                    className="auth-button register"
                    onClick={() => setShowRegisterModal(true)}
                  >
                    <FaUserPlus className="btn-icon" />
                    Registrarse
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Login
              onSuccess={() => {
                setShowLoginModal(false);
                toast.success("¡Inicio de sesión exitoso!");
              }}
            />
            <button
              className="close-modal"
              onClick={() => setShowLoginModal(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRegisterModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Register
              onSuccess={() => {
                setShowRegisterModal(false);
                toast.success("¡Registro exitoso!");
              }}
            />
            <button
              className="close-modal"
              onClick={() => setShowRegisterModal(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Sección de lobbies disponibles */}
      <div className="lobbies-section">
        <h2>Lobbies Disponibles</h2>
        {lobbies.length === 0 ? (
          <div className="empty-state">
            <MdMeetingRoom size={50} />
            <p>No hay lobbies disponibles</p>
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
                  onClick={() => {
                    if (lobby.player_count >= lobby.max_players) {
                      toast.warning("Este lobby está lleno");
                    } else {
                      handleQuickJoin(lobby.id);
                    }
                  }}
                  disabled={lobby.player_count >= lobby.max_players}
                >
                  {lobby.player_count >= lobby.max_players
                    ? "🔒 Lleno"
                    : "🚀 Unirse"}
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
