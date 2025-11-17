import { useState, useEffect } from "react";
import "./JoinNameModal.css";

function JoinNameModal({ isOpen, onClose, onSubmit, lobbyId }) {
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setPlayerName("");
      setError("");
      setTouched(false);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const validateName = (name) => {
    // Eliminar espacios al inicio y final
    const trimmedName = name.trim();

    // Validar longitud
    if (trimmedName.length < 3) {
      return "El nombre debe tener al menos 3 caracteres";
    }
    if (trimmedName.length > 20) {
      return "El nombre no puede exceder 20 caracteres";
    }

    // Validar que solo contenga letras, números, espacios y algunos caracteres especiales seguros
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s_-]+$/;
    if (!validPattern.test(trimmedName)) {
      return "Solo se permiten letras, números, espacios, guiones y guiones bajos";
    }

    // Validar que no sea solo espacios
    if (trimmedName.replace(/\s/g, "").length === 0) {
      return "El nombre no puede contener solo espacios";
    }

    // Validar que no contenga múltiples espacios consecutivos
    if (/\s{2,}/.test(trimmedName)) {
      return "No se permiten espacios consecutivos";
    }

    return "";
  };

  const handleInputChange = (e) => {
    const value = e.target.value;

    // Limitar la longitud máxima desde el input
    if (value.length <= 20) {
      setPlayerName(value);

      // Validar en tiempo real solo si el usuario ya interactuó
      if (touched) {
        const validationError = validateName(value);
        setError(validationError);
      }
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const validationError = validateName(playerName);
    setError(validationError);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);

    const validationError = validateName(playerName);

    if (validationError) {
      setError(validationError);
      return;
    }

    // Enviar el nombre limpio (sin espacios extras)
    onSubmit(playerName.trim());
    setPlayerName("");
    setError("");
    setTouched(false);
  };

  const handleCancel = () => {
    setPlayerName("");
    setError("");
    setTouched(false);
    onClose();
  };

  if (!isOpen) return null;

  const isValid = !error && playerName.trim().length >= 3;

  return (
    <div className="join-modal-overlay" onClick={handleCancel}>
      <div className="join-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="join-modal-close" onClick={handleCancel}>
          ×
        </button>

        <h3>Unirse a Lobby #{lobbyId}</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tu Nombre</label>
            <input
              type="text"
              value={playerName}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Ingresa tu nombre"
              autoFocus
              className={error && touched ? "input-error" : ""}
              maxLength={20}
            />
            {error && touched && <span className="error-message">{error}</span>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={!isValid}>
              Unirse
            </button>
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JoinNameModal;
