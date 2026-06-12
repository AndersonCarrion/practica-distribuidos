import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiUser, FiBriefcase, FiHeart, FiGrid, FiMenu, FiX } from 'react-icons/fi';
import './Navbar.css';

export default function Navbar() {
  const { usuario, isAutenticado, isInstitucion, isPostulante, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
    setMenuAbierto(false);
  }

  return (
    <nav className="navbar glass">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMenuAbierto(false)}>
          <FiGrid className="navbar-logo-icon" />
          <span className="navbar-title">MuralTech N3</span>
        </Link>

        <button className="navbar-hamburger" onClick={() => setMenuAbierto(!menuAbierto)}>
          {menuAbierto ? <FiX /> : <FiMenu />}
        </button>

        <div className={`navbar-menu ${menuAbierto ? 'abierto' : ''}`}>
          <div className="navbar-links">
            <Link to="/" className="navbar-link" onClick={() => setMenuAbierto(false)}>
              <FiBriefcase /> Mural
            </Link>
            {isAutenticado && (
              <Link to="/guardados" className="navbar-link" onClick={() => setMenuAbierto(false)}>
                <FiHeart /> Guardados
              </Link>
            )}
            {isAutenticado && isInstitucion && (
              <Link to="/dashboard/institucion" className="navbar-link" onClick={() => setMenuAbierto(false)}>
                <FiUser /> Ofertas
              </Link>
            )}
          </div>
          <div className="navbar-auth">
            {isAutenticado ? (
              <div className="navbar-user">
                <span className="navbar-user-name">{usuario?.nombre}</span>
                <button onClick={handleLogout} className="btn btn-outline btn-sm">
                  <FiLogOut /> Salir
                </button>
              </div>
            ) : (
              <div className="navbar-auth-buttons">
                <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setMenuAbierto(false)}>Ingresar</Link>
                <Link to="/registro" className="btn btn-primary btn-sm" onClick={() => setMenuAbierto(false)}>Registrarse</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
