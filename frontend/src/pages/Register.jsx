import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function Register() {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (!name || !email || !password) {
      setLocalError('Completa todos los campos');
      return;
    }
    try {
      await register(name, email, password);
      navigate('/');
    } catch {}
  };

  return (
    <div className="auth-wrap">
      <form onSubmit={onSubmit} className="card">
        <h2>Crear cuenta</h2>
        <p className="subtitle">Regístrate para empezar a jugar.</p>
        {localError && <div className="error-toast">{localError}</div>}
        {error && <div className="error-toast">{error}</div>}
        <div className="form-row">
          <label>Nombre</label>
          <input className="input" value={name} onChange={(e)=>setName(e.target.value)} type="text" placeholder="Tu nombre" />
        </div>
        <div className="form-row">
          <label>Email</label>
          <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="tu@email" />
        </div>
        <div className="form-row">
          <label>Contraseña</label>
          <input className="input" value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder="••••••••" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Registrarme'}
        </button>
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </div>
      </form>
    </div>
  );
}
