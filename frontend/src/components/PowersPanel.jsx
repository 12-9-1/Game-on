import { useState } from 'react';
import { POWERS_CONFIG } from '../utils/powersManager';
import './PowersPanel.css';

/**
 * Componente que muestra los poderes disponibles en la pregunta actual
 */
function PowersPanel({ powers, playerPoints, onPowerUsed, disabled = false }) {
  const [selectedPower, setSelectedPower] = useState(null);
  const [showTooltip, setShowTooltip] = useState(null);

  /**
   * Maneja el clic en un poder
   */
  const handlePowerClick = (power) => {
    if (disabled || power.is_used) return;

    // Verificar si hay suficientes puntos
    if (playerPoints < power.cost) {
      setSelectedPower({ ...power, error: true });
      setTimeout(() => setSelectedPower(null), 2000);
      return;
    }

    // Usar el poder
    setSelectedPower(power);
    if (onPowerUsed) {
      onPowerUsed(power.power_type);
    }
  };

  /**
   * Verifica si un poder puede ser usado
   */
  const canUsePower = (power) => {
    return !power.is_used && !disabled && playerPoints >= power.cost;
  };

  if (!powers || powers.length === 0) {
    return null;
  }

  return (
    <div className="powers-panel">
      <div className="powers-header">
        <h3 className="powers-title">
          <span className="powers-icon">✨</span>
          Poderes Disponibles
        </h3>
        <span className="powers-points">
          <span className="points-icon">💎</span>
          {playerPoints}
        </span>
      </div>

      <div className="powers-grid">
        {powers.map((power) => {
          const config = POWERS_CONFIG[power.power_type] || {};
          const canUse = canUsePower(power);
          const isSelected = selectedPower?.power_type === power.power_type;

          return (
            <div
              key={power.power_type}
              className={`power-card ${config.className || ''} ${
                power.is_used ? 'used' : ''
              } ${canUse ? 'active' : 'inactive'} ${isSelected ? 'selected' : ''}`}
              onClick={() => handlePowerClick(power)}
              onMouseEnter={() => setShowTooltip(power.power_type)}
              onMouseLeave={() => setShowTooltip(null)}
              title={!canUse && !power.is_used ? `Necesitas ${power.cost} puntos` : ''}
            >
              <div className="power-emoji" style={{ color: config.color }}>
                {config.emoji}
              </div>

              <div className="power-info">
                <h4 className="power-name">{config.name}</h4>
                <p className="power-description">{config.description}</p>
              </div>

              <div className="power-cost">
                <span className="cost-badge" style={{ backgroundColor: config.color }}>
                  {power.cost} pts
                </span>
              </div>

              {power.is_used && (
                <div className="power-used-overlay">
                  <span className="used-text">✓ Usado</span>
                </div>
              )}

              {!canUse && !power.is_used && playerPoints < power.cost && (
                <div className="power-insufficient-overlay">
                  <span className="insufficient-text">
                    -{power.cost - playerPoints}
                  </span>
                </div>
              )}

              {/* Tooltip con información detallada */}
              {showTooltip === power.power_type && !power.is_used && (
                <div className="power-tooltip">
                  <p className="tooltip-effect">
                    <strong>Efecto:</strong> {config.effect}
                  </p>
                  <p className="tooltip-status">
                    {canUse
                      ? '✓ Disponible'
                      : `✗ Necesitas ${power.cost - playerPoints} puntos más`}
                  </p>
                </div>
              )}

              {showTooltip === power.power_type && power.is_used && (
                <div className="power-tooltip">
                  <p className="tooltip-status used">Ya usado en esta pregunta</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Información auxiliar */}
      <div className="powers-info">
        <p className="info-text">
          Los poderes se descuentan de tu puntuación. Elige sabiamente para maximizar tus ganancias.
        </p>
      </div>
    </div>
  );
}

export default PowersPanel;
