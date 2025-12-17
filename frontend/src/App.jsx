// frontend/App.jsx
import { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Conexion
import SplashScreen from "./components/SplashScreen";
import { socket } from "./socket";
import Modal from "./components/Modals/Modal";

// Context
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ConfirmModalProvider } from "./contexts/ConfirmModalContext";

// Páginas
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Profile from "./pages/Profile";
import RankingGlobal from "./pages/ranking/RankingGlobal";
import Nosotros from "./pages/Nosotros";
import Page404 from "./pages/Page404";

// Layout
import Navbar from "./components/layout/navbar/Navbar";
import Footer from "./components/layout/footer/Footer";
// Toasts
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "./App.css";

const AppContent = ({ socketConnected }) => {
  const [lobbies, setLobbies] = useState([]);
  const [currentLobby, setCurrentLobby] = useState(null);
  const [error, setError] = useState(null);
  const [gameActive, setGameActive] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleOpenLogin = useCallback(() => setShowLogin(true), []);
  const handleCloseLogin = useCallback(() => setShowLogin(false), []);
  const handleOpenRegister = useCallback(() => setShowRegister(true), []);
  const handleCloseRegister = useCallback(() => setShowRegister(false), []);

  // Toast para errores
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Listeners del socket (registrar una sola vez)
  useEffect(() => {
    if (!socket || !socketConnected) return;

    const handleLobbiesList = (data) => {
      setLobbies((prev) => {
        // Solo actualizar si cambia
        if (JSON.stringify(prev) === JSON.stringify(data.lobbies)) return prev;
        return data.lobbies;
      });
    };

    const handleLobbyCreated = (data) => setCurrentLobby(data.lobby);
    const handleLobbyJoined = (data) => setCurrentLobby(data.lobby);
    const handleLobbyLeft = () => {
      setCurrentLobby(null);
      socket.emit("get_lobbies");
    };
    const handleLobbyClosed = (data) => {
      setCurrentLobby(null);
      setGameActive(false);
      setError(data.message);
      socket.emit("get_lobbies");
    };
    const handleGameStarted = () => setGameActive(true);
    const handleReturnedToLobby = (data) => {
      setGameActive(false);
      setCurrentLobby(data.lobby);
    };

    socket.on("lobbies_list", handleLobbiesList);
    socket.on("lobby_created", handleLobbyCreated);
    socket.on("lobby_joined", handleLobbyJoined);
    socket.on("lobby_left", handleLobbyLeft);
    socket.on("lobby_closed", handleLobbyClosed);
    socket.on("game_started", handleGameStarted);
    socket.on("returned_to_lobby", handleReturnedToLobby);

    // Solicitar lista al montar
    socket.emit("get_lobbies");

    return () => {
      socket.off("lobbies_list", handleLobbiesList);
      socket.off("lobby_created", handleLobbyCreated);
      socket.off("lobby_joined", handleLobbyJoined);
      socket.off("lobby_left", handleLobbyLeft);
      socket.off("lobby_closed", handleLobbyClosed);
      socket.off("game_started", handleGameStarted);
      socket.off("returned_to_lobby", handleReturnedToLobby);
    };
  }, [socketConnected]);

  // Actualizar lobbies periódicamente solo si no hay lobby activo
  useEffect(() => {
    if (!socket || !socketConnected || currentLobby) return;

    const interval = setInterval(() => {
      socket.emit("get_lobbies");
    }, 5000); // cada 5s en lugar de 3s

    return () => clearInterval(interval);
  }, [socketConnected, currentLobby]);

  const handleCreateLobby = useCallback(
    (data) => socket?.emit("create_lobby", data),
    []
  );
  const handleJoinLobby = useCallback(
    (data) => socket?.emit("join_lobby", data),
    []
  );
  const handleLeaveGame = useCallback(() => {
    socket?.emit("leave_lobby");
    setGameActive(false);
    setCurrentLobby(null);
  }, []);

  return (
    <div className="app-container">
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Navbar onLeaveGame={handleLeaveGame} />

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
          element={
            gameActive && currentLobby ? (
              <Game socket={socket} currentLobby={currentLobby} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <Profile /> : <Navigate to="/" replace />}
        />
        <Route path="/ranking" element={<RankingGlobal />} />
        <Route path="/about" element={<Nosotros />} />
        <Route path="*" element={<Page404 />} />
      </Routes>

      <Footer />
    </div>
  );
};

function App() {
  const [socketConnected, setSocketConnected] = useState(
    socket?.connected || false
  );

  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    return !hasSeenSplash;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem("hasSeenSplash", "true");
    setShowSplash(false);
  };

  // Listeners de conexión
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setSocketConnected(true);
      socket.emit("get_lobbies");
    };
    const handleDisconnect = () => setSocketConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) setSocketConnected(true);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  if (showSplash) return <SplashScreen onAnimationComplete={handleSplashComplete} />;

  if (!socketConnected) {
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
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <ConfirmModalProvider>
          <AppContent socketConnected={socketConnected} />
        </ConfirmModalProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
