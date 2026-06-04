import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import './Modal.css';

export default function Modal({ abierto, titulo, children, onCerrar }) {
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-contenido glass-darker" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-titulo">{titulo}</h3>
          <button className="modal-cerrar" onClick={onCerrar}><FiX /></button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
