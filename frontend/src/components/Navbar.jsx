import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { FaSun, FaMoon, FaUser, FaSignOutAlt, FaTrophy } from "react-icons/fa";
import styled from "styled-components";

const Navbar = (onOpenLogin, onOpenRegister) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    // Aplicar el tema guardado al cargar
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Nav>
      <NavBrand>
        <StyledNavLogo href="/" aria-label="Battle Quiz Arena">
          <LogoContainer>
            <BattleText>BATTLE</BattleText>
            <QuizText>QUIZ</QuizText>
            <ArenaText>ARENA</ArenaText>
          </LogoContainer>
        </StyledNavLogo>
      </NavBrand>
      <NavActions>
        <ThemeToggle
          onClick={toggleTheme}
          aria-label="Cambiar tema"
          title="Cambiar tema"
        >
          {theme === "light" ? <FaMoon /> : <FaSun />}
        </ThemeToggle>
        <RankingButton
          onClick={() => navigate("/ranking")}
          title="Ver ranking global"
        >
          <FaTrophy /> Ranking
        </RankingButton>
        {isAuthenticated ? (
          <>
            <ProfileButton
              onClick={() => navigate("/profile")}
              title="Ver perfil"
            >
              <FaUser /> {user?.name || "Perfil"}
            </ProfileButton>
            <LogoutButton onClick={handleLogout} title="Cerrar sesión">
              <FaSignOutAlt /> Salir
            </LogoutButton>
          </>
        ) : (
          <>
            <AuthButton onClick={onOpenLogin}>Iniciar Sesión</AuthButton>
            <AuthButton primary onClick={onOpenRegister}>
              Registrarse
            </AuthButton>
          </>
        )}
      </NavActions>
    </Nav>
  );
};

// Styled Components
const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  box-shadow: var(--box-shadow);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 2px solid var(--accent-border);
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

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
`;

const RankingButton = styled(Button)`
  background-color: transparent;
  color: var(--accent-light);
  border: 1px solid var(--accent-primary);

  &:hover {
    background-color: var(--accent-primary);
    color: var(--bg-primary);
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

const AuthButton = styled(Button)`
  background-color: ${(props) =>
    props.$primary ? "var(--accent-primary)" : "transparent"};
  color: ${(props) =>
    props.$primary ? "var(--bg-primary)" : "var(--text-primary)"};
  border: 1px solid
    ${(props) => (props.$primary ? "transparent" : "var(--accent-border)")};
  font-weight: ${(props) => (props.$primary ? "600" : "500")};

  &:hover {
    background-color: ${(props) =>
      props.$primary ? "var(--accent-hover)" : "var(--bg-hover)"};
    color: ${(props) => (props.$primary ? "white" : "var(--accent-light)")};
    transform: translateY(-1px);
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
