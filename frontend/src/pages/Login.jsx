import React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { post } from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const data = await post('/auth/login', { email, password });
      login(data.token, data.usuario);
      if (data.usuario.rol === 'institucion') {
        navigate('/dashboard/institucion');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.error || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-darker">
        <h1 className="auth-title">MuralTech</h1>
        <p className="auth-subtitle">Inicia sesión en tu cuenta</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <input className="input" type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="btn btn-primary" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="auth-link" style={{ marginTop: 8 }}>
          <Link to="/recuperar-password">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className="auth-link">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}

