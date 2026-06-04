import React from 'react';
import { FiSearch, FiSliders } from 'react-icons/fi';
import { CATEGORIAS, MODALIDADES } from '../constantes';
import './Filtros.css';

export default function Filtros({ filtros, onChange }) {
  function handleChange(key, value) {
    onChange({ ...filtros, [key]: value });
  }

  return (
    <div className="filtros glass-darker">
      <div className="filtros-header">
        <FiSliders />
        <span>Filtros</span>
      </div>
      <div className="filtros-grid">
        <div className="filtros-search">
          <FiSearch className="filtros-search-icon" />
          <input
            type="text"
            className="input"
            placeholder="Buscar ofertas..."
            value={filtros.buscar || ''}
            onChange={e => handleChange('buscar', e.target.value)}
          />
        </div>
        <select
          className="input"
          value={filtros.categoria || ''}
          onChange={e => handleChange('categoria', e.target.value)}
        >
          {CATEGORIAS.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          className="input"
          value={filtros.modalidad || ''}
          onChange={e => handleChange('modalidad', e.target.value)}
        >
          {MODALIDADES.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select
          className="input"
          value={filtros.orden || ''}
          onChange={e => handleChange('orden', e.target.value)}
        >
          <option value="">Más recientes</option>
          <option value="salario">Mejor salario</option>
        </select>
      </div>
    </div>
  );
}
