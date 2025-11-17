import { useState, useEffect } from "react";
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
import Navbar from "./components/Navbar";
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

  const handleOpenLogin = () => setShowLogin(true);
  const handleCloseLogin = () => setShowLogin(false);
  const handleOpenRegister = () => setShowRegister(true);
  const handleCloseRegister = () => setShowRegister(false);

  useEffect(() => {
    if (!socket || !socketConnected) return;

    console.log("Configurando listeners de Socket.IO...");

    socket.on("connected", (data) => {
      console.log(data.message);
    });

    socket.on("error", (data) => {
      console.error("Error:", data.message);
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    socket.on("lobbies_list", (data) => {
      setLobbies(data.lobbies);
    });

    socket.on("lobby_created", (data) => setCurrentLobby(data.lobby));
    socket.on("lobby_joined", (data) => setCurrentLobby(data.lobby));
    socket.on("lobby_left", (data) => {
      console.log(data.message);
      setCurrentLobby(null);
      socket.emit("get_lobbies");
    });
    socket.on("lobby_closed", (data) => {
      console.log("Lobby cerrado:", data.message);
      setCurrentLobby(null);
      setGameActive(false);
      setError(data.message);
      setTimeout(() => setError(null), 3000);
      socket.emit("get_lobbies");
    });
    socket.on("game_started", (data) => setGameActive(true));
    socket.on("returned_to_lobby", (data) => {
      setGameActive(false);
      setCurrentLobby(data.lobby);
    });

    // Solicitar lista de lobbies al montar
    socket.emit("get_lobbies");

    // Cleanup: solo remover listeners
    return () => {
      console.log("Limpiando listeners de Socket.IO...");
      socket.off("connected");
      socket.off("error");
      socket.off("lobbies_list");
      socket.off("lobby_created");
      socket.off("lobby_joined");
      socket.off("lobby_left");
      socket.off("lobby_closed");
      socket.off("game_started");
      socket.off("returned_to_lobby");
    };
  }, [socketConnected]);

  // Actualizar lista de lobbies periódicamente
  useEffect(() => {
    if (!socket || !socketConnected || currentLobby) return;

    const interval = setInterval(() => {
      socket.emit("get_lobbies");
    }, 3000);

    return () => clearInterval(interval);
  }, [socketConnected, currentLobby]);

  const handleCreateLobby = (data) => socket?.emit("create_lobby", data);
  const handleJoinLobby = (data) => socket?.emit("join_lobby", data);
  const handleLeaveGame = () => {
    socket?.emit("leave_lobby");
    setGameActive(false);
    setCurrentLobby(null);
  };

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

      {error && toast.error(error)}

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
  // ✅ Estado del socket a nivel de App (NO se reinicia al navegar)
  const [socketConnected, setSocketConnected] = useState(
    socket?.connected || false
  );

  // ✅ Control del Splash Screen (solo una vez por sesión)
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    return !hasSeenSplash;
  });

  const handleSplashComplete = () => {
    console.log("Splash screen completado");
    sessionStorage.setItem("hasSeenSplash", "true");
    setShowSplash(false);
  };

  // ✅ Configurar listeners del socket UNA SOLA VEZ
  useEffect(() => {
    if (!socket) return;

    console.log("Iniciando conexión Socket.IO...");

    const handleConnect = () => {
      console.log("✅ Conectado al servidor");
      setSocketConnected(true);
      socket.emit("get_lobbies");
    };

    const handleDisconnect = () => {
      console.log("❌ Desconectado del servidor");
      setSocketConnected(false);
    };

    // Listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Si el socket ya está conectado al montar
    if (socket.connected) {
      setSocketConnected(true);
    }

    // Cleanup: solo remover listeners
    return () => {
      console.log("Limpiando listeners principales de Socket.IO...");
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  // ✅ Mostrar Splash Screen (solo primera vez)
  if (showSplash) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  // ✅ Mostrar loading solo si NO está conectado
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

  // ✅ App principal con socket conectado
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
