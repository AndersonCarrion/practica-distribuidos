import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { get } from '../api';
import TarjetaOferta from '../components/TarjetaOferta';
import Filtros from '../components/Filtros';
import CargarMas from '../components/CargarMas';
import { useAuth } from '../context/AuthContext';
import './Mural.css';

const POLL_INTERVAL = 15000;

export default function Mural() {
  const { isAutenticado } = useAuth();
  const [ofertas, setOfertas] = useState([]);
  const [guardadosIds, setGuardadosIds] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [filtros, setFiltros] = useState({});
  const [nuevasCount, setNuevasCount] = useState(0);
  const pollRef = useRef(null);
  const ofertasRef = useRef(ofertas);
  const filtrosRef = useRef(filtros);

  ofertasRef.current = ofertas;
  filtrosRef.current = filtros;

  const cargarOfertas = useCallback(async (pagina, reset) => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ page: pagina, limit: 15 });
      if (filtrosRef.current.categoria) params.set('categoria', filtrosRef.current.categoria);
      if (filtrosRef.current.modalidad) params.set('modalidad', filtrosRef.current.modalidad);
      if (filtrosRef.current.orden) params.set('orden', filtrosRef.current.orden);
      if (filtrosRef.current.buscar) params.set('buscar', filtrosRef.current.buscar);
      const data = await get(`/ofertas?${params}`);
      if (reset) {
        setOfertas(data.ofertas);
      } else {
        setOfertas(prev => [...prev, ...data.ofertas]);
      }
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarGuardados = useCallback(async () => {
    if (!isAutenticado) return;
    try {
      const ids = await get('/guardados/ids');
      setGuardadosIds(ids);
    } catch { /* ignore */ }
  }, [isAutenticado]);

  useEffect(() => {
    setPage(1);
    cargarOfertas(1, true);
    cargarGuardados();
  }, [filtros, cargarOfertas, cargarGuardados]);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      if (filtrosRef.current.categoria || filtrosRef.current.modalidad || filtrosRef.current.buscar) return;
      try {
        const params = new URLSearchParams({ page: 1, limit: 1 });
        const data = await get(`/ofertas?${params}`);
        const idsActuales = new Set(ofertasRef.current.map(o => o._id));
        const nuevas = data.ofertas.filter(o => !idsActuales.has(o._id));
        if (nuevas.length > 0) {
          setNuevasCount(prev => prev + nuevas.length);
        }
      } catch { /* ignore */ }
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, []);

  function recargarNuevas() {
    setNuevasCount(0);
    setPage(1);
    cargarOfertas(1, true);
    cargarGuardados();
  }

  function cargarMas() {
    const nextPage = page + 1;
    setPage(nextPage);
    cargarOfertas(nextPage, false);
  }

  function handleGuardarCambio(ofertaId) {
    setGuardadosIds(prev =>
      prev.includes(ofertaId)
        ? prev.filter(id => id !== ofertaId)
        : [...prev, ofertaId]
    );
  }

  return (
    <div className="container mural">
      <div className="mural-header">
        <h1 className="mural-title">Mural de Ofertas</h1>
        <p className="mural-subtitle">Encuentra oportunidades laborales en tu comunidad</p>
      </div>

      <Filtros filtros={filtros} onChange={setFiltros} />

      {nuevasCount > 0 && (
        <button className="btn btn-accent" onClick={recargarNuevas} style={{ marginBottom: 12, width: '100%' }}>
          {nuevasCount} {nuevasCount === 1 ? 'nueva oferta' : 'nuevas ofertas'} — Haz clic para ver
        </button>
      )}

      {total > 0 && (
        <p className="mural-contador">{total} oferta{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}</p>
      )}

      {ofertas.length === 0 && !cargando ? (
        <div className="mural-empty glass">
          <p>No hay ofertas disponibles con esos filtros.</p>
        </div>
      ) : (
        <div className="mural-lista">
          {ofertas.map(o => (
            <TarjetaOferta
              key={o._id}
              oferta={o}
              onGuardarCambio={handleGuardarCambio}
              esGuardado={guardadosIds.includes(o._id)}
            />
          ))}
        </div>
      )}

      <CargarMas
        onCargar={cargarMas}
        hayMas={page < totalPages}
        cargando={cargando}
      />
    </div>
  );
}
