import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { post } from '../api';
import './Auth.css';

export default function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await post('/auth/recuperar', { email });
      setEnviado(true);
    } catch (err) {
      setError(err.error || 'Error al enviar solicitud');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-darker">
        <h1 className="auth-title">MuralTech</h1>
        <p className="auth-subtitle">Recuperar contraseña</p>
        {enviado ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
              Si el correo existe, recibirás un enlace de recuperación.
            </p>
            <Link to="/login" className="btn btn-primary">Volver al inicio</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            <input className="input" type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required />
            <button type="submit" className="btn btn-primary" disabled={cargando}>
              {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
            <p className="auth-link">
              <Link to="/login">Volver al inicio de sesión</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
