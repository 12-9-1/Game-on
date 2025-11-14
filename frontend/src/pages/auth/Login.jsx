import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styled from 'styled-components';
import { FaEnvelope, FaLock } from 'react-icons/fa';

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
    <AuthContainer>
      <h2>Iniciar Sesión</h2>
      {error && <ErrorText>{error}</ErrorText>}
      <AuthForm onSubmit={handleSubmit}>
        <FormGroup>
          <InputGroup>
            <InputIcon>
              <FaEnvelope />
            </InputIcon>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              autoComplete="username email"
              required
            />
          </InputGroup>
        </FormGroup>
        
        <FormGroup>
          <InputGroup>
            <InputIcon>
              <FaLock />
            </InputIcon>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              required
            />
          </InputGroup>
        </FormGroup>
        
        <SubmitButton type="submit" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </SubmitButton>
        
        <AuthFooter>
          ¿No tienes una cuenta?{' '}
          <button 
            type="button" 
            onClick={onSuccess} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#007bff', 
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
              fontSize: '0.95rem'
            }}
          >
            Regístrate
          </button>
        </AuthFooter>
      </AuthForm>
    </AuthContainer>
  );
};

// Styled Components
const AuthContainer = styled.div`
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  
  h2 {
    text-align: center;
    color: ${({ theme }) => theme.text};
    margin-bottom: 1.5rem;
  }
`;

const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

const ErrorText = styled.p`
  color: #ff4d4f;
  margin-bottom: 1rem;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const InputGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.span`
  position: absolute;
  left: 1rem;
  color: var(--text-muted);
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid var(--teal-light);
  border-radius: var(--border-radius);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  transition: var(--transition);
  
  &:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
  }
  
  &::placeholder {
    color: var(--text-muted);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const AuthFooter = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  color: #6c757d;
  font-size: 0.95rem;
  
  button {
    background: none;
    border: none;
    color: #007bff;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    font-size: 0.95rem;
    
    &:hover {
      color: #0056b3;
    }
  }
`;

const AuthLinks = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
`;

const ErrorMessage = styled.div`
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  border-left: 3px solid #ef4444;
`;

export default Login;
