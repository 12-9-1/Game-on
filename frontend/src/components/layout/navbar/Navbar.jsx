import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useConfirmModal } from "../../../contexts/ConfirmModalContext";
import { useEffect, useState } from "react";
import {
  FaSun,
  FaMoon,
  FaUser,
  FaSignOutAlt,
  FaTrophy,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import "./Navbar.css";

const Navbar = ({ onLeaveGame }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { showConfirm } = useConfirmModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => setIsMenuOpen((prev) => !prev);
  const handleMenuClose = () => setIsMenuOpen(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const isInLobby = location.pathname === "/lobby";
  const isInGame = location.pathname === "/game";

  const handleLogoClick = async (e) => {
    e.preventDefault();

    if (isInLobby) {
      await showConfirm({
        title: "Abandonar Lobby",
        message: "¿Estás seguro de que quieres abandonar el lobby?",
        confirmText: "Sí, abandonar",
        cancelText: "Cancelar",
        isDangerous: false,
        onConfirm: () => {
          navigate("/");
        },
      });
    } else if (isInGame) {
      await showConfirm({
        title: "⚠️ Abandonar Juego",
        message: "¿Estás seguro que deseas abandonar? Se perderá tu progreso.",
        confirmText: "Sí, salir",
        cancelText: "Cancelar",
        isDangerous: true,
        onConfirm: () => {
          if (onLeaveGame) {
            onLeaveGame();
          }
          navigate("/");
        },
      });
    } else {
      navigate("/");
    }
  };

  const handleSessionLogout = async () => {
    await showConfirm({
      title: "Cerrar sesión",
      message: "¿Estás seguro que deseas cerrar sesión?",
      confirmText: "Sí, cerrar sesión",
      cancelText: "Cancelar",
      isDangerous: false,
      onConfirm: () => {
        logout();
        navigate("/");
      },
    });
  };

  const handleGameExit = async () => {
    await showConfirm({
      title: "⚠️ Abandonar Juego",
      message: "¿Estás seguro que deseas abandonar? Se perderá tu progreso.",
      confirmText: "Sí, salir",
      cancelText: "Cancelar",
      isDangerous: true,
      onConfirm: () => {
        if (onLeaveGame) {
          onLeaveGame();
        }
      },
    });
  };

  const handleGoToRanking = async () => {
    if (isInLobby) {
      await showConfirm({
        title: "Abandonar Lobby",
        message:
          "¿Estás seguro que quieres abandonar el lobby para ver el ranking?",
        confirmText: "Sí, ir al ranking",
        cancelText: "Cancelar",
        isDangerous: false,
        onConfirm: () => {
          navigate("/ranking");
        },
      });
    } else {
      navigate("/ranking");
    }
  };

  const handleGoToProfile = async () => {
    if (isInLobby) {
      await showConfirm({
        title: "Abandonar Lobby",
        message: "¿Estás seguro de que quieres abandonar el lobby?",
        confirmText: "Sí, ir al perfil",
        cancelText: "Cancelar",
        isDangerous: false,
        onConfirm: () => {
          navigate("/profile");
        },
      });
    } else {
      navigate("/profile");
    }
  };

  return (
    <>
      {isMenuOpen && (
        <div className="navbar-overlay" onClick={handleMenuClose}></div>
      )}
      <nav className="navbar">
        <div className="navbar-brand">
          <a
            className="navbar-logo"
            onClick={handleLogoClick}
            aria-label="Battle Quiz Arena"
          >
            <div className="logo-container">
              <span className="logo-battle">BATTLE</span>
              <span className="logo-quiz">QUIZ</span>
              <span className="logo-arena">ARENA</span>
            </div>
          </a>
        </div>

        <button
          className="navbar-hamburger"
          onClick={handleMenuToggle}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div
          className={`navbar-actions ${
            isMenuOpen ? "navbar-actions-open" : ""
          }`}
        >
          <button
            className="navbar-button navbar-theme-toggle"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            title="Cambiar tema"
          >
            {theme === "light" ? <FaMoon /> : <FaSun />}
          </button>

          {!isInGame && (
            <button
              className="navbar-button navbar-ranking"
              onClick={handleGoToRanking}
              title="Ver ranking global"
            >
              <FaTrophy /> <span>Ranking</span>
            </button>
          )}

          {isInGame && (
            <button
              className="navbar-button navbar-logout"
              onClick={handleGameExit}
              title="Salir del juego"
            >
              <FaSignOutAlt /> <span>Salir del juego</span>
            </button>
          )}

          {isAuthenticated && !isInGame && (
            <>
              <button
                className="navbar-button navbar-profile"
                onClick={handleGoToProfile}
                title="Ver perfil"
              >
                <FaUser /> <span>{user?.name || "Perfil"}</span>
              </button>
              <button
                className="navbar-button navbar-logout"
                onClick={handleSessionLogout}
                title="Cerrar sesión"
              >
                <FaSignOutAlt /> <span>Cerrar sesión</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
