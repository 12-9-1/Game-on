import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { FaTrophy, FaGamepad } from 'react-icons/fa';


// Use Vite-exposed env var, fallback to legacy name
const backendUrl = import.meta.env.VITE_BACKEND_URL

const Profile = () => {
  const { user } = useAuth();
  const [gamesWon, setGamesWon] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.public_id) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${backendUrl}/obtenerUsuarios`);
      const data = await response.json();
      
      if (data.usuarios) {
        const currentUser = data.usuarios.find(u => u.name === user.name);
        if (currentUser) {
          setGamesWon(currentUser.games_won);
        }
      }
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <Loading>Cargando perfil...</Loading>;

  return (
    <ProfileContainer>
      <ProfileTitle>Perfil de Usuario</ProfileTitle>
      <ProfileInfo>
        <ProfileAvatar>👤</ProfileAvatar>
        <ProfileDetails>
          <DetailItem><strong>Nombre:</strong> {user.name}</DetailItem>
          <DetailItem><strong>Email:</strong> {user.email}</DetailItem>
        </ProfileDetails>
      </ProfileInfo>

      <StatsSection>
        <StatsTitle>Estadísticas</StatsTitle>
        <StatsContainer>
          <StatCard>
            <StatIcon>
              <FaTrophy />
            </StatIcon>
            <StatContent>
              <StatLabel>Partidas Ganadas</StatLabel>
              <StatValue>{loading ? '...' : gamesWon}</StatValue>
            </StatContent>
          </StatCard>
          
          <StatCard>
            <StatIcon>
              <FaGamepad />
            </StatIcon>
            <StatContent>
              <StatLabel>Jugador Registrado</StatLabel>
              <StatValue>✓</StatValue>
            </StatContent>
          </StatCard>
        </StatsContainer>
      </StatsSection>
    </ProfileContainer>
  );
};

// Styled Components
const ProfileContainer = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2.5rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  border: 1px solid var(--teal-light);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const ProfileTitle = styled.h1`
  color: var(--accent-light);
  margin-bottom: 2rem;
  text-align: center;
  font-size: 2.2rem;
  position: relative;
  padding-bottom: 1rem;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 3px;
    background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
    border-radius: 3px;
  }
`;

const ProfileInfo = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  margin-top: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const ProfileAvatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--teal-medium), var(--accent-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.5rem;
  flex-shrink: 0;
  color: var(--text-primary);
  border: 3px solid var(--accent-border);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
  }
`;

const ProfileDetails = styled.div`
  font-size: 1.1rem;
  line-height: 1.8;
  flex: 1;
`;

const DetailItem = styled.p`
  margin: 0.75rem 0;
  padding: 0.75rem 1rem;
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  border-left: 3px solid var(--accent-primary);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(5px);
    background-color: var(--bg-hover);
  }
  
  strong {
    color: var(--accent-light);
    margin-right: 0.5rem;
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-primary);
`;

const StatsSection = styled.div`
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 2px solid var(--teal-light);
`;

const StatsTitle = styled.h2`
  color: var(--accent-light);
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--bg-primary), rgba(0, 0, 0, 0.1));
  border-radius: var(--border-radius);
  border: 1px solid var(--teal-light);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    border-color: var(--accent-primary);
  }
`;

const StatIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, var(--accent-primary), var(--teal-medium));
  border-radius: 50%;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const StatContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StatLabel = styled.p`
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
`;

const StatValue = styled.p`
  margin: 0;
  color: var(--accent-light);
  font-size: 1.5rem;
  font-weight: 700;
`;

export default Profile;
