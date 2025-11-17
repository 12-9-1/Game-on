import React from 'react';
import { Link } from 'react-router-dom';
import { FaGamepad, FaHome, FaSearch } from 'react-icons/fa';
import './Page404.css';

function Page404() {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-icon">
          <FaGamepad />
        </div>
        
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">¡Página no encontrada!</h2>
        
        <p className="not-found-text">
          Parece que te has perdido en la arena. Esta página no existe o ha sido movida.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="not-found-btn primary">
            <FaHome />
            <span>Volver al inicio</span>
          </Link>
          <Link to="/ranking" className="not-found-btn secondary">
            <FaSearch />
            <span>Ver Ranking</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Page404;
