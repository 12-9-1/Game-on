//frontend/src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
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


const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';


const AppContent = () => {
  const [socket, setSocket] = useState(null);
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

  // Manejar cuando termina el splash
  const handleSplashComplete = () => {
    console.log("Splash screen completado");
    setShowSplash(false);
    setIsInitialized(true);
  };

  useEffect(() => {
    // Conectar a Socket.IO con configuración mejorada

    console.log("Iniciando conexión Socket.IO...");
    
    // Conectar a Socket.IO
    const newSocket = io(import.meta.env.VITE_BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
      forceNew: true,
      withCredentials: true,
      extraHeaders: {
        'Access-Control-Allow-Origin': `${import.meta.env.VITE_URL_FRONTEND}`,
        'Access-Control-Allow-Credentials': 'true'
      }
    });

    newSocket.on('connect', () => {
      console.log('Conectado al servidor');
      setConnected(true);
      setSocket(newSocket);
      // Solicitar lista de lobbies
      newSocket.emit('get_lobbies');
    });

    newSocket.on('disconnect', () => {
      console.log('Desconectado del servidor');
      setConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log(data.message);
    });

    newSocket.on('error', (data) => {
      console.error('Error:', data.message);
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    newSocket.on('lobbies_list', (data) => {
      setLobbies(data.lobbies);
    });

    newSocket.on('lobby_created', (data) => {
      console.log('Lobby creado:', data.lobby);
      setCurrentLobby(data.lobby);
    });

    newSocket.on('lobby_joined', (data) => {
      console.log('Te uniste al lobby:', data.lobby);
      setCurrentLobby(data.lobby);
    });

    newSocket.on('lobby_left', (data) => {
      console.log(data.message);
      setCurrentLobby(null);
      newSocket.emit('get_lobbies');
    });

    newSocket.on('lobby_closed', (data) => {
      console.log('Lobby cerrado:', data.message);
      setCurrentLobby(null);
      setGameActive(false);
      setError(data.message);
      setTimeout(() => setError(null), 3000);
      newSocket.emit('get_lobbies');
    });

    newSocket.on('game_started', (data) => {
      console.log('Juego iniciado:', data);
      setGameActive(true);
    });

    newSocket.on('returned_to_lobby', (data) => {
      console.log('Volviendo al lobby:', data);
      setGameActive(false);
      setCurrentLobby(data.lobby);
    });

    return () => {
      console.log("Cerrando conexión Socket.IO...");
      newSocket.close();
    };
  }, []); // Array vacío - solo se ejecuta una vez

  // Actualizar lista de lobbies periódicamente
  useEffect(() => {
    if (!socket || !connected || currentLobby) return;

    const interval = setInterval(() => {
      socket.emit('get_lobbies');
    }, 3000);

    return () => clearInterval(interval);
  }, [socket, connected, currentLobby]);

  const handleCreateLobby = (data) => {
    if (socket) {
      socket.emit('create_lobby', data);
    }
  };

  const handleJoinLobby = (data) => {
    if (socket) {
      socket.emit('join_lobby', data);
    }
  };

  const handleLeaveGame = () => {
    if (socket) {
      socket.emit('leave_lobby');
    }
    setGameActive(false);
    setCurrentLobby(null);
  };

  // Mostrar splash screen primero
  if (showSplash) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  // Esperar inicialización después del splash
  if (!isInitialized) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <h2>Inicializando aplicación...</h2>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras se conecta
  if (!connected) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <h2>Conectando al servidor...</h2>
          <p>Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar onLeaveGame={handleLeaveGame} />
      
      {error && (
        <div className="error-toast">
          ⚠️ {error}
        </div>
      )}

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
              <Home 
                socket={socket}
                lobbies={lobbies}
                onCreateLobby={handleCreateLobby}
                onJoinLobby={handleJoinLobby}
              />
            )
          } 
        />
        <Route 
          path="/lobby" 
          element={
            currentLobby && !gameActive ? (
              <Lobby 
                lobby={currentLobby} 
                socket={socket}
              />
            ) : gameActive ? (
              <Navigate to="/game" replace />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/game" 
          element={
            gameActive && currentLobby ? (
              <Game 
                socket={socket}
                currentLobby={currentLobby}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/profile" 
          element={isAuthenticated ? <Profile /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/ranking" 
          element={<RankingGlobal />} 
        />
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