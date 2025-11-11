import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password) { setLocalError('Completa email y contraseña'); return; }
    try {
      await login(email, password);
      navigate('/');
    } catch {}
  };

  return (
    <div className="auth-wrap">
      <form onSubmit={onSubmit} className="card">
        <h2>Iniciar sesión</h2>
        <p className="subtitle">Accede para crear o unirte a lobbies.</p>
        {localError && <div className="error-toast">{localError}</div>}
        {error && <div className="error-toast">{error}</div>}
        <div className="form-row">
          <label>Email</label>
          <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="tu@email" />
        </div>
        <div className="form-row">
          <label>Contraseña</label>
          <input className="input" value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder="••••••••" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
        </div>
      </form>
    </div>
  );
}
