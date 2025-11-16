import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import "./Auth.css";

const Login = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      return setError('Por favor completa todos los campos');
    }

    try {
      setError('');
      setLoading(true);
      const result = await login(email, password);
      
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Iniciar Sesión</h2>
      {error && <p className="error-text">{error}</p>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="input-group">
            <span className="input-icon">
              <FaEnvelope />
            </span>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              autoComplete="username email"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <div className="input-group">
            <span className="input-icon">
              <FaLock />
            </span>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        <button className="submit-button" type="submit" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
};

export default Login;
