import { useState, useRef } from "react";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import "./Auth.css";

const Register = ({ onSuccess }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) newErrors.name = "Campo incompleto";
    else if (trimmedName.length < 2)
      newErrors.name = "El nombre debe tener al menos 2 caracteres";
    else if (trimmedName.length > 20)
      newErrors.name = "El nombre no puede exceder 20 caracteres";

    if (!trimmedEmail) newErrors.email = "Campo incompleto";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
      newErrors.email = "Email inválido";

    if (!password) newErrors.password = "Campo incompleto";
    else if (password.length < 6)
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";

    if (!confirmPassword) newErrors.confirmPassword = "Campo incompleto";
    else if (confirmPassword !== password)
      newErrors.confirmPassword = "Las contraseñas no coinciden";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const order = ["name", "email", "password", "confirmPassword"];
      const first = order.find((f) => newErrors[f]);
      if (first === "name") nameRef.current?.focus();
      else if (first === "email") emailRef.current?.focus();
      else if (first === "password") passwordRef.current?.focus();
      else if (first === "confirmPassword") confirmRef.current?.focus();
      return;
    }

    try {
      setError("");
      setLoading(true);
      const result = await register(name, email, password);

      if (result.success) {
        // Close the modal by calling onSuccess if it exists
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.message || "Error al registrar el usuario");
      }
    } catch (err) {
      setError("Error al registrar el usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Registro</h2>
        {error && <div className="error-message">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="input-group">
              <span className="input-icon">
                <FaUser />
              </span>
              <input
                ref={nameRef}
                className={`auth-input ${errors.name ? "input-error" : ""}`}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder="Nombre"
                autoComplete="name"
              />
            </div>
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <div className="input-group">
              <span className="input-icon">
                <FaEnvelope />
              </span>
              <input
                ref={emailRef}
                className={`auth-input ${errors.email ? "input-error" : ""}`}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                placeholder="Correo electrónico"
                autoComplete="username email"
              />
            </div>
            {errors.email && (
              <span className="field-error">{errors.email}</span>
            )}
          </div>
          <div className="form-group">
            <div className="input-group">
              <span className="input-icon">
                <FaLock />
              </span>
              <input
                ref={passwordRef}
                className={`auth-input ${errors.password ? "input-error" : ""}`}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                placeholder="Contraseña"
                autoComplete="new-password"
              />
            </div>
            {errors.password && (
              <span className="field-error">{errors.password}</span>
            )}
          </div>
          <div className="form-group">
            <div className="input-group">
              <span className="input-icon">
                <FaLock />
              </span>
              <input
                ref={confirmRef}
                className={`auth-input ${
                  errors.confirmPassword ? "input-error" : ""
                }`}
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors({ ...errors, confirmPassword: "" });
                }}
                placeholder="Confirmar Contraseña"
                autoComplete="new-password"
              />
            </div>
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword}</span>
            )}
          </div>
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
