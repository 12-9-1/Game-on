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
import { socket } from "./socket"; // <-- usamos la instancia global
import './App.css';

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

  const handleSplashComplete = () => {
    console.log("Splash screen completado");
    setShowSplash(false);
    setIsInitialized(true);
  };

  useEffect(() => {
    // ⚡ Conexión Socket.IO usando la instancia global
    if (!socket) return;

    console.log("Iniciando conexión Socket.IO...");

    socket.on('connect', () => {
      console.log('Conectado al servidor');
      setConnected(true);
      socket.emit('get_lobbies');
    });

    socket.on('disconnect', () => {
      console.log('Desconectado del servidor');
      setConnected(false);
    });

    socket.on('connected', (data) => {
      console.log(data.message);
    });

    socket.on('error', (data) => {
      console.error('Error:', data.message);
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    socket.on('lobbies_list', (data) => {
      setLobbies(data.lobbies);
    });

    socket.on('lobby_created', (data) => setCurrentLobby(data.lobby));
    socket.on('lobby_joined', (data) => setCurrentLobby(data.lobby));
    socket.on('lobby_left', (data) => {
      console.log(data.message);
      setCurrentLobby(null);
      socket.emit('get_lobbies');
    });
    socket.on('lobby_closed', (data) => {
      console.log('Lobby cerrado:', data.message);
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

    // Cleanup: solo remover listeners, NO desconectar el socket
    // El socket es global y debe mantenerse conectado durante toda la vida de la app
    return () => {
      console.log("Limpiando listeners de Socket.IO...");
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connected');
      socket.off('error');
      socket.off('lobbies_list');
      socket.off('lobby_created');
      socket.off('lobby_joined');
      socket.off('lobby_left');
      socket.off('lobby_closed');
      socket.off('game_started');
      socket.off('returned_to_lobby');
    };
    
  }, []);

  // Actualizar lista de lobbies periódicamente
  useEffect(() => {
    if (!socket || !connected || currentLobby) return;

    const interval = setInterval(() => {
      socket.emit('get_lobbies');
    }, 3000);

    return () => clearInterval(interval);
  }, [connected, currentLobby]);

  const handleCreateLobby = (data) => socket?.emit('create_lobby', data);
  const handleJoinLobby = (data) => socket?.emit('join_lobby', data);
  const handleLeaveGame = () => {
    socket?.emit('leave_lobby');
    setGameActive(false);
    setCurrentLobby(null);
  };

  if (showSplash) return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  if (!isInitialized) return (
    <div className="app-container">
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <h2>Inicializando aplicación...</h2>
      </div>
    </div>
  );
  if (!connected) return (
    <div className="app-container">
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <h2>Conectando al servidor...</h2>
        <p>Por favor espera un momento</p>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <Navbar onLeaveGame={handleLeaveGame} />

      {error && <div className="error-toast">⚠️ {error}</div>}

      <Modal isOpen={showLogin} onClose={handleCloseLogin}><Login onSuccess={handleCloseLogin} /></Modal>
      <Modal isOpen={showRegister} onClose={handleCloseRegister}><Register onSuccess={handleCloseRegister} /></Modal>

      <Routes>
        <Route path="/" element={
          currentLobby ? <Navigate to="/lobby" replace /> :
          <Home socket={socket} lobbies={lobbies} onCreateLobby={handleCreateLobby} onJoinLobby={handleJoinLobby} />
        } />
        <Route path="/lobby" element={
          currentLobby && !gameActive ? <Lobby lobby={currentLobby} socket={socket} /> :
          gameActive ? <Navigate to="/game" replace /> :
          <Navigate to="/" replace />
        } />
        <Route path="/game" element={
          gameActive && currentLobby ? <Game socket={socket} currentLobby={currentLobby} /> :
          <Navigate to="/" replace />
        } />
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
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
