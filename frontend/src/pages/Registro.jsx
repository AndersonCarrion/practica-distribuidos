import React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { post } from '../api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Registro() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', nombre: '', rol: 'postulante' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const data = await post('/auth/registro', form);
      login(data.token, data.usuario);
      if (data.usuario.rol === 'institucion') {
        navigate('/dashboard/institucion');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.errores) {
        setError(err.errores.map(e => e.msg).join('. '));
      } else {
        setError(err.error || 'Error al registrarse');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-darker">
        <h1 className="auth-title">MuralTech</h1>
        <p className="auth-subtitle">Crea tu cuenta</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <input className="input" type="text" placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
          <input className="input" type="email" placeholder="Correo electrónico" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input className="input" type="password" placeholder="Contraseña (mín. 6 caracteres)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          <select className="input" value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
            <option value="postulante">Postulante (busco trabajo)</option>
            <option value="institucion">Institución (publico ofertas)</option>
          </select>
          <button type="submit" className="btn btn-primary" disabled={cargando}>
            {cargando ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>
        <p className="auth-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

