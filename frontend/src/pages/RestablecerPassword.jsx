import React from 'react';
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { post } from '../api';
import './Auth.css';

export default function RestablecerPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('Mínimo 6 caracteres');
      return;
    }
    setCargando(true);
    try {
      await post('/auth/restablecer', { token, password });
      setExito(true);
    } catch (err) {
      setError(err.error || 'Error al restablecer');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-darker">
        <h1 className="auth-title">MuralTech</h1>
        <p className="auth-subtitle">Nueva contraseña</p>
        {exito ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
              Contraseña actualizada exitosamente.
            </p>
            <Link to="/login" className="btn btn-primary">Iniciar sesión</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            <input className="input" type="password" placeholder="Nueva contraseña (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            <input className="input" type="password" placeholder="Confirmar contraseña" value={confirmar} onChange={e => setConfirmar(e.target.value)} required />
            <button type="submit" className="btn btn-primary" disabled={cargando}>
              {cargando ? 'Actualizando...' : 'Restablecer contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
