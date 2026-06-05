import React from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiBookmark, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { post } from '../api';
import { labelCategoria, tiempoRelativo } from '../constantes';
import './TarjetaOferta.css';

export default function TarjetaOferta({ oferta, onGuardarCambio, esGuardado }) {
  const { isAutenticado } = useAuth();

  async function toggleGuardar(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAutenticado) return;
    try {
      await post('/guardados', { oferta_id: oferta._id });
      if (onGuardarCambio) onGuardarCambio(oferta._id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Link to={`/oferta/${oferta._id}`} className="tarjeta-oferta-lista glass">
      {oferta.destacada && (
        <div className="tfl-destacada-bar" />
      )}
      <div className="tfl-logo">
        {oferta.logo_url ? (
          <img src={oferta.logo_url} alt="" className="tfl-logo-img" />
        ) : (
          <div className="tfl-logo-placeholder">
            {oferta.institucion_nombre?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      <div className="tfl-contenido">
        <div className="tfl-superior">
          <div className="tfl-info">
            <h3 className="tfl-titulo">{oferta.titulo}</h3>
            <p className="tfl-empresa">{oferta.institucion_nombre}</p>
            <div className="tfl-detalles">
              {oferta.ubicacion && (
                <span className="tfl-detalle"><FiMapPin size={13} /> {oferta.ubicacion}</span>
              )}
              <span className="tfl-detalle"><FiClock size={13} /> {tiempoRelativo(oferta.createdAt)}</span>
            </div>
            {oferta.descripcion && (
              <p className="tfl-descripcion">{oferta.descripcion.substring(0, 150)}...</p>
            )}
          </div>
          <div className="tfl-derecha">
            {oferta.salario_min > 0 && (
              <span className="tfl-salario">
                ${oferta.salario_min.toLocaleString()}{oferta.salario_max > oferta.salario_min ? ` - $${oferta.salario_max.toLocaleString()}` : ''}
              </span>
            )}
            <div className="tfl-tags">
              <span className={`badge badge-${oferta.modalidad}`}>{oferta.modalidad}</span>
              <span className="badge tfl-categoria">{labelCategoria(oferta.categoria)}</span>
              {oferta.destacada && <span className="badge badge-destacada">Destacada</span>}
              {oferta.patrocinada && <span className="badge badge-ad">Ad</span>}
            </div>
          </div>
        </div>
        <div className="tfl-inferior">
          <button
            className={`tfl-guardar ${esGuardado ? 'guardado' : ''}`}
            onClick={toggleGuardar}
            title={esGuardado ? 'Quitar de guardados' : 'Guardar oferta'}
          >
            <FiBookmark />
            <span>{esGuardado ? 'Guardado' : 'Guardar'}</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
