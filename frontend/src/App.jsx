// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Navbar from './components/Navbar';
import Modal from './components/Modal';
import SplashScreen from './components/SplashScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/Profile';
import RankingGlobal from './pages/ranking/RankingGlobal';
import './App.css';
import { io } from 'socket.io-client';

// URLs del backend y frontend desde .env
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // debe ser tu URL de Render
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL; // debe ser tu URL de Render


// Creamos el socket global (no conectado automáticamente)
const socket = io(BACKEND_URL, {

  transports: ['websocket'],
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  forceNew: true,
});


const AppContent = () => {
  const [connected, setConnected] = useState(false);
  const [lobbies, setLobbies] = useState([]);
  const [currentLobby, setCurrentLobby] = useState(null);
  const [error, setError] = useState(null);
  const [gameActive, setGameActive] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleOpenLogin = () => setShowLogin(true);
  const handleCloseLogin = () => setShowLogin(false);
  const handleOpenRegister = () => setShowRegister(true);
  const handleCloseRegister = () => setShowRegister(false);

  // Cuando termina el splash
  const handleSplashComplete = () => {
    setShowSplash(false);
    setIsInitialized(true);
  };

  // Conexión socket después del splash
  useEffect(() => {
    if (!isInitialized) return;

    console.log('Conectando a Socket.IO...');
    socket.connect();

    socket.on('connect', () => {
      console.log('Socket conectado');
      setConnected(true);
      socket.emit('get_lobbies'); // obtenemos lobbies al conectar
    });

    socket.on('disconnect', () => {
      console.log('Socket desconectado');
      setConnected(false);
    });

    socket.on('error', (data) => {
      console.error('Error:', data?.message || data);
      setError(data?.message || 'Error en la conexión');
      setTimeout(() => setError(null), 3000);
    });

    socket.on('lobbies_list', (data) => setLobbies(data.lobbies));
    socket.on('lobby_created', (data) => setCurrentLobby(data.lobby));
    socket.on('lobby_joined', (data) => setCurrentLobby(data.lobby));
    socket.on('lobby_left', (data) => {
      setCurrentLobby(null);
      socket.emit('get_lobbies');
    });
    socket.on('lobby_closed', (data) => {
      setCurrentLobby(null);
      setGameActive(false);
      setError(data.message);
      setTimeout(() => setError(null), 3000);
      socket.emit('get_lobbies');
    });
    socket.on('game_started', (data) => setGameActive(true));
    socket.on('returned_to_lobby', (data) => {
      setGameActive(false);
      setCurrentLobby(data.lobby);
    });

    return () => {
      console.log('Desconectando socket...');
      socket.disconnect();
    };
  }, [isInitialized]);

  // Actualizar lobbies cada 3 segundos si estamos conectados y sin lobby
  useEffect(() => {
    if (!connected || currentLobby) return;

    const interval = setInterval(() => {
      socket.emit('get_lobbies');
    }, 3000);

    return () => clearInterval(interval);
  }, [connected, currentLobby]);

  const handleCreateLobby = (data) => socket.emit('create_lobby', data);
  const handleJoinLobby = (data) => socket.emit('join_lobby', data);
  const handleLeaveGame = () => {
    socket.emit('leave_lobby');
    setGameActive(false);
    setCurrentLobby(null);
  };

  // Pantallas condicionales
  if (showSplash) return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  if (!isInitialized)
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <h2>Inicializando aplicación...</h2>
        </div>
      </div>
    );
  if (!connected)
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <h2>Conectando al servidor...</h2>
          <p>Por favor espera un momento</p>
        </div>
      </div>
    );

  return (
    <div className="app-container">
      <Navbar onLeaveGame={handleLeaveGame} />

      {error && <div className="error-toast">⚠️ {error}</div>}

      <Modal isOpen={showLogin} onClose={handleCloseLogin}>
        <Login onSuccess={handleCloseLogin} />
      </Modal>

      <Modal isOpen={showRegister} onClose={handleCloseRegister}>
        <Register onSuccess={handleCloseRegister} />
      </Modal>

      <Routes>
        <Route
          path="/"
          element={
            currentLobby ? (
              <Navigate to="/lobby" replace />
            ) : (
              <Home socket={socket} lobbies={lobbies} onCreateLobby={handleCreateLobby} onJoinLobby={handleJoinLobby} />
            )
          }
        />
        <Route
          path="/lobby"
          element={
            currentLobby && !gameActive ? (
              <Lobby lobby={currentLobby} socket={socket} />
            ) : gameActive ? (
              <Navigate to="/game" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/game"
          element={gameActive && currentLobby ? <Game socket={socket} currentLobby={currentLobby} /> : <Navigate to="/" replace />}
        />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/" replace />} />
        <Route path="/ranking" element={<RankingGlobal />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
