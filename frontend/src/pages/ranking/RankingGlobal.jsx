import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { FaMedal, FaTrophy, FaFire } from 'react-icons/fa';
import './RankingGlobal.css';

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
        const topTen = data.usuarios.slice(0, 10);
        setUsuarios(topTen);
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
      y: -4,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const handleRowHoverEnd = (index) => {
    gsap.to(rowsRef.current[index], {
      y: 0,
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
      <div className="ranking-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ranking-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="ranking-container" ref={containerRef}>
      <div className="ranking-header">
        <h1 className="ranking-title">
          <FaFire style={{ marginRight: '10px', color: '#e9bf65ffff' }} />
          Ranking Global
        </h1>
        <p className="ranking-subtitle">Top 10 jugadores con mayores partidas ganadas</p>
      </div>

      <div className="table-container">
        <table className="ranking-table">
          <thead>
            <tr>
              <th>Posición</th>
              <th>Jugador</th>
              <th>Partidas Ganadas</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario, index) => (
              <tr
                key={index}
                ref={(el) => (rowsRef.current[index] = el)}
                onMouseEnter={() => handleRowHover(index)}
                onMouseLeave={() => handleRowHoverEnd(index)}
                className={`ranking-row`}
              >
                <td className="rank-cell">
                  <div className="medal-container">{getMedalIcon(usuario.rank)}</div>
                </td>
                <td className="name-cell">{usuario.name}</td>
                <td className="score-cell">
                  <span className="score-badge">{usuario.games_won}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {usuarios.length === 0 && (
        <div className="empty-state">
          <p>No hay usuarios en el ranking aún</p>
        </div>
      )}
    </div>
  );
};

export default RankingGlobal;
