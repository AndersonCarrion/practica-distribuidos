import React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('usuario');
    if (t && u) {
      setToken(t);
      setUsuario(JSON.parse(u));
    }
    setCargando(false);
  }, []);

  function login(t, u) {
    localStorage.setItem('token', t);
    localStorage.setItem('usuario', JSON.stringify(u));
    setToken(t);
    setUsuario(u);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  }

  const isInstitucion = usuario?.rol === 'institucion';
  const isPostulante = usuario?.rol === 'postulante';
  const isAutenticado = !!token;

  return (
    <AuthContext.Provider value={{ usuario, token, cargando, login, logout, isInstitucion, isPostulante, isAutenticado }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

