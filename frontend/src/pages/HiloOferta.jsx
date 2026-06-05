import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get, post } from '../api';
import { useAuth } from '../context/AuthContext';
import { FiMapPin, FiArrowLeft, FiSend, FiMessageSquare, FiClock } from 'react-icons/fi';
import { tiempoRelativo, labelCategoria } from '../constantes';
import Modal from '../components/Modal';
import './HiloOferta.css';

export default function HiloOferta() {
  const { id } = useParams();
  const { isAutenticado, usuario } = useAuth();
  const [oferta, setOferta] = useState(null);
  const [interacciones, setInteracciones] = useState([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [modalResponder, setModalResponder] = useState(null);
  const [textoRespuesta, setTextoRespuesta] = useState('');

  useEffect(() => {
    async function cargar() {
      try {
        const [o, i] = await Promise.all([
          get(`/ofertas/${id}`),
          get(`/interacciones/${id}`)
        ]);
        setOferta(o);
        setInteracciones(i);
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [id]);

  async function enviarPregunta(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await post('/interacciones', {
        oferta_id: id,
        texto: texto.trim(),
        tipo: 'pregunta'
      });
      setTexto('');
      const i = await get(`/interacciones/${id}`);
      setInteracciones(i);
    } catch (err) {
      console.error(err);
    } finally {
      setEnviando(false);
    }
  }

  function abrirResponder(preguntaId) {
    setModalResponder(preguntaId);
    setTextoRespuesta('');
  }

  async function enviarRespuesta() {
    if (!textoRespuesta.trim() || !modalResponder) return;
    try {
      await post('/interacciones', {
        oferta_id: id,
        texto: textoRespuesta.trim(),
        tipo: 'respuesta',
        padre_id: modalResponder
      });
      setModalResponder(null);
      setTextoRespuesta('');
      const i = await get(`/interacciones/${id}`);
      setInteracciones(i);
    } catch (err) {
      alert(err?.error || 'Error al responder');
    }
  }

  if (cargando) {
    return <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>Cargando...</div>;
  }

  if (!oferta) {
    return <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>Oferta no encontrada</div>;
  }

  return (
    <div className="container hilo">
      <Link to="/" className="hilo-volver"><FiArrowLeft /> Volver al mural</Link>

      <div className="hilo-oferta glass">
        <div className="hilo-header">
          {oferta.logo_url ? (
            <img src={oferta.logo_url} alt="" className="hilo-logo" />
          ) : (
            <div className="hilo-logo-placeholder">
              {oferta.institucion_nombre?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <h1 className="hilo-titulo">{oferta.titulo}</h1>
            <p className="hilo-empresa">{oferta.institucion_nombre}</p>
          </div>
        </div>

        <div className="hilo-meta">
          {oferta.ubicacion && (
            <span className="hilo-ubicacion"><FiMapPin /> {oferta.ubicacion}</span>
          )}
          <span className="hilo-fecha-publicacion"><FiClock /> {tiempoRelativo(oferta.createdAt)}</span>
        </div>

        <div className="hilo-tags">
          <span className={`badge badge-${oferta.modalidad}`}>{oferta.modalidad}</span>
          <span className="badge hilo-categoria-badge">{labelCategoria(oferta.categoria)}</span>
          {oferta.salario_min > 0 && (
            <span className="hilo-salario">
              ${oferta.salario_min.toLocaleString()}{oferta.salario_max > oferta.salario_min ? ` - $${oferta.salario_max.toLocaleString()}` : ''}
            </span>
          )}
          {oferta.destacada && <span className="badge badge-destacada">Destacada</span>}
        </div>

        <p className="hilo-descripcion">{oferta.descripcion}</p>
      </div>

      <div className="hilo-interacciones glass">
        <h2 className="hilo-interacciones-titulo">
          <FiMessageSquare /> Preguntas y Respuestas
        </h2>

        {isAutenticado ? (
          <form className="hilo-form" onSubmit={enviarPregunta}>
            <textarea
              className="input"
              placeholder="Haz una pregunta sobre esta oferta..."
              value={texto}
              onChange={e => setTexto(e.target.value)}
              maxLength={500}
            />
            <button type="submit" className="btn btn-primary" disabled={enviando || !texto.trim()}>
              <FiSend /> {enviando ? 'Enviando...' : 'Preguntar'}
            </button>
          </form>
        ) : (
          <p className="hilo-login-msg">
            <Link to="/login">Inicia sesión</Link> para hacer preguntas sobre esta oferta.
          </p>
        )}

        <div className="hilo-comentarios">
          {interacciones.length === 0 ? (
            <p className="hilo-sin-comentarios">No hay preguntas aún. ¡Sé el primero en preguntar!</p>
          ) : (
            interacciones.map(p => (
              <div key={p._id} className="hilo-pregunta">
                <div className="hilo-pregunta-card">
                  <div className="hilo-comentario-header">
                    <strong>{p.usuario_nombre}</strong>
                    <span className="hilo-fecha">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="hilo-comentario-texto">{p.texto}</p>
                  {isAutenticado && usuario?.rol === 'institucion' && usuario?.institucion_id === oferta.institucion_id && !p.respuesta && (
                    <button className="btn btn-sm btn-outline" onClick={() => abrirResponder(p._id)}>
                      Responder
                    </button>
                  )}
                </div>
                {p.respuesta && (
                  <div className="hilo-respuesta">
                    <div className="hilo-comentario-header">
                      <strong>{p.respuesta.usuario_nombre}</strong>
                      <span className="badge" style={{ background: 'var(--accent)', color: '#1a1a2e', fontSize: 10 }}>Respuesta oficial</span>
                      <span className="hilo-fecha">
                        {new Date(p.respuesta.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="hilo-comentario-texto">{p.respuesta.texto}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Modal abierto={!!modalResponder} titulo="Responder pregunta" onCerrar={() => setModalResponder(null)}>
        <textarea
          className="input"
          placeholder="Escribe tu respuesta..."
          value={textoRespuesta}
          onChange={e => setTextoRespuesta(e.target.value)}
          rows={4}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn btn-outline" onClick={() => setModalResponder(null)}>Cancelar</button>
          <button className="btn btn-primary" onClick={enviarRespuesta} disabled={!textoRespuesta.trim()}>Enviar respuesta</button>
        </div>
      </Modal>
    </div>
  );
}

