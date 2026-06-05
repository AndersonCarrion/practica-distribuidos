import React from 'react';
import { useEffect, useRef } from 'react';
import { FiLoader } from 'react-icons/fi';

export default function CargarMas({ onCargar, hayMas, cargando }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!hayMas || cargando) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onCargar();
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hayMas, cargando, onCargar]);

  if (!hayMas) return null;

  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '30px 0' }}>
      {cargando ? (
        <FiLoader className="spinner" size={28} />
      ) : (
        <button className="btn btn-outline" onClick={onCargar}>
          Cargar más ofertas
        </button>
      )}
    </div>
  );
}

