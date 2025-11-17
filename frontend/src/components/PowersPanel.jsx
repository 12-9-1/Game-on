import { useState, useEffect } from "react";
import { POWERS_CONFIG } from "../utils/powersManager";
import "./PowersPanel.css";

function PowersPanel({ powers, playerPoints, onPowerUsed, disabled = false }) {
  const [localPowers, setLocalPowers] = useState([]);
  const [selectedPower, setSelectedPower] = useState(null);
  const [showTooltip, setShowTooltip] = useState(null);

  // Sincronizar poderes cuando cambien desde el padre
  useEffect(() => {
    if (powers && powers.length > 0) {
      setLocalPowers(powers);
    }
  }, [powers]);

  const handlePowerClick = (power) => {
    // ⭐ Verificación más estricta
    if (disabled || power.is_used) {
      setSelectedPower(null);
      return;
    }

    // Verificar puntos
    if (playerPoints < power.cost) {
      setSelectedPower({ ...power, error: true });
      setTimeout(() => setSelectedPower(null), 2000);
      return;
    }

    setSelectedPower(power);

    // Notificar al padre
    if (onPowerUsed) {
      onPowerUsed(power.power_type);
    }
  };

  const canUsePower = (power) => {
    return !power.is_used && !disabled && playerPoints >= power.cost;
  };

  if (!localPowers || localPowers.length === 0) {
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
        {localPowers.map((power) => {
          const config = POWERS_CONFIG[power.power_type] || {};
          const canUse = canUsePower(power);
          const isSelected = selectedPower?.power_type === power.power_type;

          return (
            <div
              key={power.power_type}
              className={`power-card ${config.className || ""} ${
                power.is_used ? "used" : ""
              } ${canUse ? "active" : "inactive"} ${
                isSelected ? "selected" : ""
              }`}
              onClick={() => handlePowerClick(power)}
              onMouseEnter={() => setShowTooltip(power.power_type)}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <div
                className="power-emoji"
                style={{
                  color: power.is_used ? "#6b7280" : config.color,
                }}
              >
                {config.emoji}
              </div>

              <div className="power-info">
                <h4 className="power-name">{config.name}</h4>
                <p className="power-description">
                  {power.is_used ? "Ya usado" : config.description}
                </p>
              </div>

              <div className="power-cost">
                <span
                  className="cost-badge"
                  style={{
                    backgroundColor: power.is_used ? "#6b7280" : config.color,
                  }}
                >
                  {power.cost} pts
                </span>
              </div>

              {/* Overlay cuando está usado */}
              {power.is_used && (
                <div className="power-used-overlay">
                  <span className="used-text">✓ Usado</span>
                </div>
              )}

              {/* Overlay de puntos insuficientes */}
              {!canUse && !power.is_used && playerPoints < power.cost && (
                <div className="power-insufficient-overlay">
                  <span className="insufficient-text">
                    Faltan {power.cost - playerPoints} pts
                  </span>
                </div>
              )}

              {/* Tooltips */}
              {showTooltip === power.power_type && (
                <div className="power-tooltip">
                  {power.is_used ? (
                    <p className="tooltip-status used">
                      ✗ Ya usado en esta partida
                    </p>
                  ) : canUse ? (
                    <>
                      <p className="tooltip-effect">
                        <strong>Efecto:</strong> {config.effect}
                      </p>
                      <p className="tooltip-status">✓ Click para usar</p>
                    </>
                  ) : (
                    <p className="tooltip-status error">
                      ✗ Necesitas {power.cost - playerPoints} puntos más
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="powers-info">
        <p className="info-text">
          ⚠️ Cada poder solo se puede usar <strong>UNA VEZ por partida</strong>.
          Se descuentan de tu puntuación al usarlos.
        </p>
      </div>
    </div>
  );
}

export default PowersPanel;
