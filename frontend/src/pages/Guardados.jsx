import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { get } from '../api';
import TarjetaOferta from '../components/TarjetaOferta';
import { FiHeart } from 'react-icons/fi';
import './Mural.css';

export default function Guardados() {
  const [ofertas, setOfertas] = useState([]);
  const [guardadosIds, setGuardadosIds] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [ofertasData, idsData] = await Promise.all([
        get('/guardados'),
        get('/guardados/ids')
      ]);
      setOfertas(ofertasData);
      setGuardadosIds(idsData);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function handleGuardarCambio(ofertaId) {
    setOfertas(prev => prev.filter(o => o._id !== ofertaId));
    setGuardadosIds(prev => prev.filter(id => id !== ofertaId));
  }

  return (
    <div className="container mural">
      <div className="mural-header">
        <h1 className="mural-title"><FiHeart /> Ofertas Guardadas</h1>
        <p className="mural-subtitle">Tus ofertas favoritas para revisar más tarde</p>
      </div>

      {cargando ? (
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Cargando...</p>
      ) : ofertas.length === 0 ? (
        <div className="mural-empty glass">
          <p>No tienes ofertas guardadas. Explora el mural y guarda las que te interesen.</p>
        </div>
      ) : (
        <div className="mural-lista">
          {ofertas.map(o => (
            <TarjetaOferta
              key={o._id}
              oferta={o}
              onGuardarCambio={handleGuardarCambio}
              esGuardado={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
