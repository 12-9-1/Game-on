import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { FaSun, FaMoon, FaUser, FaSignOutAlt, FaTrophy } from 'react-icons/fa';
import styled from 'styled-components';

const Navbar = ({ onOpenLogin, onOpenRegister }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    // Aplicar el tema guardado al cargar
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Nav>
      <NavBrand>
        <NavLogo to="/">
          <Accent>Game</Accent> On
        </NavLogo>
      </NavBrand>
      <NavActions>
        <ThemeToggle 
          onClick={toggleTheme} 
          aria-label="Cambiar tema"
          title="Cambiar tema"
        >
          {theme === 'light' ? <FaMoon /> : <FaSun />}
        </ThemeToggle>
        <RankingButton 
          onClick={() => navigate('/ranking')} 
          title="Ver ranking global"
        >
          <FaTrophy /> Ranking
        </RankingButton>
        {isAuthenticated ? (
          <>
            <ProfileButton 
              onClick={() => navigate('/profile')} 
              title="Ver perfil"
            >
              <FaUser /> {user?.name || 'Perfil'}
            </ProfileButton>
            <LogoutButton 
              onClick={handleLogout} 
              title="Cerrar sesión"
            >
              <FaSignOutAlt /> Salir
            </LogoutButton>
          </>
        ) : (
          <>
            <AuthButton onClick={onOpenLogin}>
              Iniciar Sesión
            </AuthButton>
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

const NavLogo = styled(Link)`
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 700;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Accent = styled.span`
  color: var(--accent-light);
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
  background-color: ${props => props.primary ? 'var(--accent-primary)' : 'transparent'};
  color: ${props => props.primary ? 'var(--bg-primary)' : 'var(--text-primary)'};
  border: 1px solid ${props => props.primary ? 'transparent' : 'var(--accent-border)'};
  font-weight: ${props => props.primary ? '600' : '500'};
  
  &:hover {
    background-color: ${props => props.primary ? 'var(--accent-hover)' : 'var(--bg-hover)'};
    color: ${props => props.primary ? 'white' : 'var(--accent-light)'};
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
