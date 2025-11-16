import { useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { FaEnvelope, FaLock } from "react-icons/fa";
import "./Auth.css";

const Login = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, isAuthenticated } = useAuth();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) newErrors.email = "Campo incompleto";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
      newErrors.email = "Email inválido";

    if (!password) newErrors.password = "Campo incompleto";
    else if (password.length < 6)
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const order = ["email", "password"];
      const first = order.find((f) => newErrors[f]);
      if (first === "email") emailRef.current?.focus();
      else if (first === "password") passwordRef.current?.focus();
      return;
    }

    try {
      setError("");
      setLoading(true);
      const result = await login(email, password);

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.message || "Error al iniciar sesión");
      }
    } catch (err) {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Iniciar Sesión</h2>
      {error && <p className="error-text">{error}</p>}
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
          {errors.email && <span className="field-error">{errors.email}</span>}
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
              autoComplete="current-password"
            />
          </div>
          {errors.password && (
            <span className="field-error">{errors.password}</span>
          )}
        </div>

        <button className="submit-button" type="submit" disabled={loading}>
          {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </button>
      </form>
    </div>
  );
};

export default Login;
