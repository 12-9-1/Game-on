import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useConfirmModal } from "../contexts/ConfirmModalContext";
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
import styled from "styled-components";

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
      // Navigate directly if not in lobby or game
      navigate("/");
    }
  };

  const handleSessionLogout = async () => {
    const confirmed = await showConfirm({
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
    const confirmed = await showConfirm({
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
      const confirmed = await showConfirm({
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
      const confirmed = await showConfirm({
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

  const showBackButton = false;

  return (
    <>
      {isMenuOpen && <Overlay onClick={handleMenuClose} />}
      <Nav>
        <NavBrand>
          <StyledNavLogo
            onClick={handleLogoClick}
            aria-label="Battle Quiz Arena"
          >
            <LogoContainer>
              <BattleText>BATTLE</BattleText>
              <QuizText>QUIZ</QuizText>
              <ArenaText>ARENA</ArenaText>
            </LogoContainer>
          </StyledNavLogo>
        </NavBrand>
        <HamburgerButton onClick={handleMenuToggle} aria-label="Toggle menu">
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </HamburgerButton>
        <NavActions $isOpen={isMenuOpen}>
          {showBackButton && (
            <BackButton onClick={handleBackFromLobby}>← Volver</BackButton>
          )}
          <ThemeToggle
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            title="Cambiar tema"
          >
            {theme === "light" ? <FaMoon /> : <FaSun />}
          </ThemeToggle>
          {!isInGame && (
            <RankingButton
              onClick={handleGoToRanking}
              title="Ver ranking global"
            >
              <FaTrophy /> Ranking
            </RankingButton>
          )}
          {isInGame && (
            <LogoutButton onClick={handleGameExit} title="Salir del juego">
              <FaSignOutAlt /> Salir del juego
            </LogoutButton>
          )}
          {isAuthenticated && !isInGame && (
            <>
              <ProfileButton onClick={handleGoToProfile} title="Ver perfil">
                <FaUser /> {user?.name || "Perfil"}
              </ProfileButton>
              <LogoutButton onClick={handleSessionLogout} title="Cerrar sesión">
                <FaSignOutAlt /> Cerrar sesión
              </LogoutButton>
            </>
          )}
        </NavActions>
      </Nav>
    </>
  );
};

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: transparent;
  backdrop-filter: blur(10px);
  color: var(--text-primary);
  box-shadow: var(--box-shadow);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 2px solid var(--accent-border);

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const NavBrand = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
`;

const LogoContainer = styled.div`
  position: relative;
  display: inline-flex;
  flex-direction: column;
  font-family: "Bebas Neue", "Arial Black", Arial, sans-serif;
  font-weight: 900;
  line-height: 1;
  padding-right: 4rem;
  gap: 0.1rem;
  overflow: visible;

  @media (max-width: 768px) {
    padding-right: 2rem;
  }
`;

const BattleText = styled.span`
  font-size: 1.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(251, 191, 36, 0.5);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const QuizText = styled.span`
  font-size: 1.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #a5f3fc 0%, #cffafe 50%, #f0f9ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const ArenaText = styled.span`
  position: absolute;
  top: 105%;
  right: 3rem;
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%);
  text-shadow: 0 10px 30px rgba(251, 191, 36, 0.6);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.4));
  transform: translateY(-50%) rotate(-18deg);
  transform-origin: left center;
  white-space: nowrap;
  margin: 0;
  padding: 0;
  font-weight: 800;
  z-index: 10;

  @media (max-width: 768px) {
    font-size: 0.7rem;
    right: -2rem;
  }
`;

const StyledNavLogo = styled.a`
  color: white;
  text-decoration: none;
  font-weight: 700;
  display: flex;
  align-items: center;
  overflow: visible;
  cursor: pointer;
`;

const NavActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100vw;
    background-color: var(--bg-secondary);
    backdrop-filter: blur(20px);
    flex-direction: column;
    padding: 1.5rem 1rem 2rem 1rem;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    max-height: ${(props) => (props.$isOpen ? "500px" : "0")};
    overflow: hidden;
    gap: 1.5rem;
    align-items: stretch;
    visibility: ${(props) => (props.$isOpen ? "visible" : "hidden")};
    pointer-events: ${(props) => (props.$isOpen ? "auto" : "none")};
    transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.3s;
    z-index: 999;
  }
`;

const HamburgerButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: var(--accent-light);
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 1001;
  padding: 0.5rem;
  border-radius: var(--border-radius);
  transition: all 0.3s ease;

  &:hover {
    background-color: var(--bg-hover);
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const Overlay = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 998;
    backdrop-filter: blur(2px);
  }
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 0.75rem 1rem;
    justify-content: flex-start;
  }
`;

const RankingButton = styled(Button)`
  background-color: transparent;
  color: var(--fffffff);
  border: 1px solid var(--accent-primary);

  &:hover {
    background-color: var(--teal-lighter);
    color: var(--accent-light);
  }
`;

const ProfileButton = styled(Button)`
  background-color: var(--teal-light);
  color: var(--text-primary);
  border: 1px solid var(--accent-border);

  &:hover {
    background-color: var(--teal-lighter);
    color: var(--accent-light);
  }
`;

const LogoutButton = styled(Button)`
  background-color: var(--accent-primary);
  color: var(--bg-primary);
  font-weight: 600;

  &:hover {
    background-color: var(--accent-hover);
    color: white;
  }
`;

const BackButton = styled(Button)`
  background-color: transparent;
  color: var(--accent-light);
  border: 1px solid var(--accent-border);

  &:hover {
    background-color: var(--bg-hover);
    color: var(--accent-primary);
  }
`;

const ThemeToggle = styled(Button)`
  background: none;
  border: none;
  color: var(--accent-light);
  font-size: 1.2rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background-color: var(--bg-hover);
    transform: rotate(30deg);
  }
`;

export default Navbar;
