import { useState, useEffect } from 'react';
import './JoinNameModal.css';

function JoinNameModal({ isOpen, onClose, onSubmit, lobbyId }) {
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setPlayerName('');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      onSubmit(playerName);
      setPlayerName('');
    }
  };

  const handleCancel = () => {
    setPlayerName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="join-modal-overlay" onClick={handleCancel}>
      <div className="join-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="join-modal-close" onClick={handleCancel}>×</button>
        
        <h3>Unirse a Lobby #{lobbyId}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tu Nombre</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ingresa tu nombre"
              autoFocus
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-primary">Unirse</button>
            <button 
              type="button" 
              className="btn-cancel"
              onClick={handleCancel}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JoinNameModal;
