import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import { useAuth } from './store/auth';
import './App.css';

const SOCKET_URL = 'http://localhost:5000';

function App() {
  const { user, token, clearAuth } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lobbies, setLobbies] = useState([]);
  const [currentLobby, setCurrentLobby] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Conectar a Socket.IO
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
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
      setError(data.message);
      setTimeout(() => setError(null), 3000);
      newSocket.emit('get_lobbies');
    });

    return () => {
      newSocket.close();
    };
  }, []);

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
    <Router>
      <div className="app-container">
        <div style={{ display:'flex', gap:12, padding:12, alignItems:'center' }}>
          {user ? (
            <>
              <Link to="/account">Mi cuenta</Link>
              <button className="btn btn-ghost" onClick={clearAuth} style={{ marginLeft: 'auto', width: 'auto' }}>Salir</button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/login" style={{ width: 'auto' }}>Ingresar</Link>
              <Link className="btn btn-primary" to="/register" style={{ width: 'auto' }}>Registrarme</Link>
            </>
          )}
        </div>
        {error && (
          <div className="error-toast">
            ⚠️ {error}
          </div>
        )}
        
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
              currentLobby ? (
                <Lobby 
                  lobby={currentLobby} 
                  socket={socket}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
          <Route path="/account" element={user ? <Account /> : <Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
