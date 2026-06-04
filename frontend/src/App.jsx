import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Mural from './pages/Mural';
import HiloOferta from './pages/HiloOferta';
import DashboardInstitucion from './pages/DashboardInstitucion';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Guardados from './pages/Guardados';
import RecuperarPassword from './pages/RecuperarPassword';
import RestablecerPassword from './pages/RestablecerPassword';
import './App.css';

function RutaProtegida({ children, soloInstitucion }) {
  const { isAutenticado, isInstitucion, cargando } = useAuth();
  if (cargando) return null;
  if (!isAutenticado) return <Navigate to="/login" replace />;
  if (soloInstitucion && !isInstitucion) return <Navigate to="/" replace />;
  return children;
}

function AppLayout() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Mural />} />
        <Route path="/oferta/:id" element={<HiloOferta />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/reset-password/:token" element={<RestablecerPassword />} />
        <Route path="/guardados" element={
          <RutaProtegida><Guardados /></RutaProtegida>
        } />
        <Route path="/dashboard/institucion" element={
          <RutaProtegida soloInstitucion><DashboardInstitucion /></RutaProtegida>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

