import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import gsap from 'gsap';
import { FaMedal, FaTrophy, FaFire } from 'react-icons/fa';

const RankingGlobal = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const rowsRef = useRef([]);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/obtenerUsuarios');
      const data = await response.json();
      
      if (data.usuarios) {
        setUsuarios(data.usuarios);
        // Animar filas cuando se cargan
        setTimeout(() => animateRows(), 100);
      }
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const animateRows = () => {
    if (rowsRef.current.length === 0) return;

    // Animar entrada de filas
    gsap.fromTo(
      rowsRef.current,
      {
        opacity: 0,
        x: -50,
        scale: 0.95
      },
      {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out'
      }
    );
  };

  const handleRowHover = (index) => {
    gsap.to(rowsRef.current[index], {
      scale: 1.02,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const handleRowHoverEnd = (index) => {
    gsap.to(rowsRef.current[index], {
      scale: 1,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const getMedalIcon = (rank) => {
    switch (rank) {
      case 1:
        return <FaTrophy style={{ color: '#FFD700' }} />;
      case 2:
        return <FaMedal style={{ color: '#C0C0C0' }} />;
      case 3:
        return <FaMedal style={{ color: '#CD7F32' }} />;
      default:
        return <span style={{ color: 'var(--accent-light)' }}>{rank}º</span>;
    }
  };

  if (loading) {
    return (
      <RankingContainer>
        <LoadingSpinner>
          <div className="spinner"></div>
          <p>Cargando ranking...</p>
        </LoadingSpinner>
      </RankingContainer>
    );
  }

  if (error) {
    return (
      <RankingContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </RankingContainer>
    );
  }

  return (
    <RankingContainer ref={containerRef}>
      <RankingHeader>
        <Title>
          <FaFire style={{ marginRight: '10px', color: '#FF6B6B' }} />
          Ranking Global
        </Title>
        <Subtitle>Top jugadores por partidas ganadas</Subtitle>
      </RankingHeader>

      <TableContainer>
        <RankingTable>
          <thead>
            <tr>
              <th>Posición</th>
              <th>Jugador</th>
              <th>Partidas Ganadas</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario, index) => (
              <RankingRow
                key={index}
                ref={(el) => (rowsRef.current[index] = el)}
                onMouseEnter={() => handleRowHover(index)}
                onMouseLeave={() => handleRowHoverEnd(index)}
                rank={usuario.rank}
              >
                <RankCell>
                  <MedalContainer>{getMedalIcon(usuario.rank)}</MedalContainer>
                </RankCell>
                <NameCell>{usuario.name}</NameCell>
                <ScoreCell>
                  <ScoreBadge>{usuario.games_won}</ScoreBadge>
                </ScoreCell>
              </RankingRow>
            ))}
          </tbody>
        </RankingTable>
      </TableContainer>

      {usuarios.length === 0 && (
        <EmptyState>
          <p>No hay usuarios en el ranking aún</p>
        </EmptyState>
      )}
    </RankingContainer>
  );
};

// Styled Components
const RankingContainer = styled.div`
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  border: 1px solid var(--teal-light);
  min-height: 500px;
`;

const RankingHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--accent-primary);
`;

const Title = styled.h1`
  color: var(--accent-light);
  font-size: 2.2rem;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0;
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const RankingTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  thead {
    background: linear-gradient(135deg, var(--teal-medium), var(--accent-primary));
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  th {
    padding: 1rem;
    text-align: left;
    color: white;
    font-weight: 600;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const RankingRow = styled.tr`
  border-bottom: 1px solid var(--teal-light);
  transition: all 0.3s ease;
  background: var(--bg-primary);
  cursor: pointer;
  
  &:hover {
    background: var(--bg-hover);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  ${props => props.rank === 1 && `
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.1), transparent);
    border-left: 4px solid #FFD700;
  `}
  
  ${props => props.rank === 2 && `
    background: linear-gradient(90deg, rgba(192, 192, 192, 0.1), transparent);
    border-left: 4px solid #C0C0C0;
  `}
  
  ${props => props.rank === 3 && `
    background: linear-gradient(90deg, rgba(205, 127, 50, 0.1), transparent);
    border-left: 4px solid #CD7F32;
  `}
`;

const RankCell = styled.td`
  padding: 1rem;
  font-weight: 600;
  color: var(--accent-light);
  width: 100px;
`;

const MedalContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
`;

const NameCell = styled.td`
  padding: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 1.05rem;
  flex: 1;
`;

const ScoreCell = styled.td`
  padding: 1rem;
  text-align: right;
  font-weight: 600;
`;

const ScoreBadge = styled.span`
  display: inline-block;
  background: linear-gradient(135deg, var(--accent-primary), var(--teal-medium));
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.95rem;
  font-weight: 600;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  min-width: 60px;
  text-align: center;
`;

const LoadingSpinner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 1rem;
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid var(--teal-light);
    border-top: 4px solid var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  p {
    color: var(--text-secondary);
    font-size: 1.1rem;
  }
`;

const ErrorMessage = styled.div`
  padding: 2rem;
  text-align: center;
  color: #FF6B6B;
  font-size: 1.1rem;
  background: rgba(255, 107, 107, 0.1);
  border-radius: var(--border-radius);
  border: 1px solid #FF6B6B;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text-secondary);
  font-size: 1.1rem;
`;

export default RankingGlobal;
