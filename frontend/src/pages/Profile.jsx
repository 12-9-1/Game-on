import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return <Loading>Cargando perfil...</Loading>;

  return (
    <ProfileContainer>
      <ProfileTitle>Perfil de Usuario</ProfileTitle>
      <ProfileInfo>
        <ProfileAvatar>👤</ProfileAvatar>
        <ProfileDetails>
          <DetailItem><strong>Nombre:</strong> {user.name}</DetailItem>
          <DetailItem><strong>Email:</strong> {user.email}</DetailItem>
          <DetailItem><strong>ID de usuario:</strong> {user.public_id}</DetailItem>
        </ProfileDetails>
      </ProfileInfo>
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

export default Profile;
