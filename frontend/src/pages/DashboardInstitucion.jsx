import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { get, post, put, del, uploadLogo } from '../api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIAS, labelCategoria } from '../constantes';
import Modal from '../components/Modal';
import { FiPlus, FiEdit2, FiTrash2, FiStar, FiUpload, FiCheck } from 'react-icons/fi';
import './DashboardInstitucion.css';

export default function DashboardInstitucion() {
  const { usuario, login } = useAuth();
  const [ofertas, setOfertas] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [errores, setErrores] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalDestacar, setModalDestacar] = useState(null);
  const fileInputRef = useRef(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  const [form, setForm] = useState({
    titulo: '', descripcion: '', categoria: 'otro',
    salario_min: '', salario_max: '', modalidad: 'presencial', ubicacion: ''
  });

  const cargarOfertas = useCallback(async () => {
    try {
      const data = await get('/ofertas/institucion/mis-ofertas');
      setOfertas(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { cargarOfertas(); }, [cargarOfertas]);

  function resetForm() {
    setForm({ titulo: '', descripcion: '', categoria: 'otro', salario_min: '', salario_max: '', modalidad: 'presencial', ubicacion: '' });
    setEditandoId(null);
    setMostrarForm(false);
    setErrores(null);
  }

  function editarOferta(oferta) {
    setForm({
      titulo: oferta.titulo,
      descripcion: oferta.descripcion,
      categoria: oferta.categoria,
      salario_min: oferta.salario_min || '',
      salario_max: oferta.salario_max || '',
      modalidad: oferta.modalidad,
      ubicacion: oferta.ubicacion || ''
    });
    setEditandoId(oferta._id);
    setMostrarForm(true);
    setErrores(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrores(null);
    try {
      const body = {
        ...form,
        salario_min: form.salario_min ? Number(form.salario_min) : 0,
        salario_max: form.salario_max ? Number(form.salario_max) : 0
      };
      if (editandoId) {
        await put(`/ofertas/${editandoId}`, body);
      } else {
        await post('/ofertas', body);
      }
      resetForm();
      cargarOfertas();
    } catch (err) {
      if (err.errores) setErrores(err.errores);
      else setErrores([{ msg: err.error || 'Error al guardar' }]);
    }
  }

  async function confirmarEliminar() {
    if (!modalEliminar) return;
    try {
      await del(`/ofertas/${modalEliminar._id}`);
      setModalEliminar(null);
      cargarOfertas();
    } catch (err) {
      console.error(err);
    }
  }

  async function confirmarDestacar() {
    if (!modalDestacar) return;
    try {
      await post(`/ofertas/${modalDestacar._id}/destacar`, { horas: 24 });
      setModalDestacar(null);
      cargarOfertas();
    } catch (err) {
      alert(err?.error || 'Error al destacar');
    }
  }

  async function quitarDestacado(ofertaId) {
    try {
      await put(`/ofertas/${ofertaId}`, { destacada: false, destacada_hasta: null });
      cargarOfertas();
    } catch (err) {
      console.error(err);
    }
  }

  function estaDestacada(oferta) {
    if (!oferta.destacada || !oferta.destacada_hasta) return false;
    return new Date(oferta.destacada_hasta) > new Date();
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoLogo(true);
    try {
      const data = await uploadLogo(file);
      const usuarioActualizado = { ...usuario, logo_url: data.logo_url };
      login(localStorage.getItem('token'), usuarioActualizado);
      cargarOfertas();
    } catch (err) {
      alert(err?.error || 'Error al subir logo');
    } finally {
      setSubiendoLogo(false);
    }
  }

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <div className="dashboard-perfil">
          {usuario?.logo_url ? (
            <img src={usuario.logo_url} alt="" className="dashboard-logo" key={usuario.logo_url} />
          ) : (
            <div className="dashboard-logo-placeholder">{usuario?.nombre?.charAt(0)?.toUpperCase() || '?'}</div>
          )}
          <div>
            <h1 className="dashboard-titulo">{usuario?.nombre}</h1>
            <button className="btn btn-sm btn-outline" onClick={() => fileInputRef.current?.click()} disabled={subiendoLogo}>
              <FiUpload /> {subiendoLogo ? 'Subiendo...' : 'Subir logo'}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" hidden />
          </div>
        </div>
      </div>

      <div className="dashboard-accion">
        <button className="btn btn-primary" onClick={() => { resetForm(); setMostrarForm(true); }}>
          <FiPlus /> Nueva Oferta
        </button>
      </div>

      {mostrarForm && (
        <form className="dashboard-form glass-darker" onSubmit={handleSubmit}>
          <h3>{editandoId ? 'Editar Oferta' : 'Crear Oferta'}</h3>
          {errores && (
            <div className="dashboard-errores">
              {errores.map((e, i) => <p key={i} className="dashboard-error">{e.msg}</p>)}
            </div>
          )}
          <div className="form-grid">
            <input className="input" placeholder="Título del cargo" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required />
            <select className="input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
              {CATEGORIAS.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input className="input" type="number" placeholder="Salario mínimo" value={form.salario_min} onChange={e => setForm({ ...form, salario_min: e.target.value })} />
            <input className="input" type="number" placeholder="Salario máximo" value={form.salario_max} onChange={e => setForm({ ...form, salario_max: e.target.value })} />
            <select className="input" value={form.modalidad} onChange={e => setForm({ ...form, modalidad: e.target.value })}>
              <option value="presencial">Presencial</option>
              <option value="remoto">Remoto</option>
              <option value="hibrido">Híbrido</option>
            </select>
            <input className="input" placeholder="Ubicación" value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} />
          </div>
          <textarea className="input" placeholder="Descripción detallada de la oferta" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={5} required />
          <div className="form-acciones">
            <button type="submit" className="btn btn-accent">{editandoId ? 'Actualizar' : 'Publicar'}</button>
            <button type="button" className="btn btn-outline" onClick={resetForm}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="dashboard-lista">
        <h3>Mis Ofertas ({ofertas.length})</h3>
        {ofertas.length === 0 ? (
          <p className="dashboard-vacio">Aún no has publicado ofertas.</p>
        ) : (
          <div className="dashboard-tabla">
            <div className="dashboard-tabla-header">
              <span>Título</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            {ofertas.map(o => (
              <div key={o._id} className={`dashboard-tabla-fila ${estaDestacada(o) ? 'destacada' : ''}`}>
                <div className="dashboard-tabla-info">
                  <strong>{o.titulo}</strong>
                  <span className="dashboard-tabla-meta">{labelCategoria(o.categoria)} · {o.modalidad}</span>
                </div>
                <div>
                  {estaDestacada(o) ? (
                    <span className="badge badge-destacada">Destacada</span>
                  ) : (
                    <span className="badge" style={{ background: o.activa ? '#d1fae5' : '#fce7f3', color: o.activa ? '#065f46' : '#be123c' }}>
                      {o.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  )}
                </div>
                <div className="dashboard-acciones">
                  <button className="btn-icon" onClick={() => editarOferta(o)} title="Editar"><FiEdit2 /></button>
                  {estaDestacada(o) ? (
                    <button className="btn-icon" style={{ color: 'var(--accent)' }} onClick={() => quitarDestacado(o._id)} title="Quitar destacado">
                      <FiCheck />
                    </button>
                  ) : (
                    <button className="btn-icon" onClick={() => setModalDestacar(o)} title="Destacar por 24 h">
                      <FiStar />
                    </button>
                  )}
                  <button className="btn-icon danger" onClick={() => setModalEliminar(o)} title="Eliminar"><FiTrash2 /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal abierto={!!modalEliminar} titulo="Eliminar Oferta" onCerrar={() => setModalEliminar(null)}>
        <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
          ¿Estás seguro de eliminar <strong>{modalEliminar?.titulo}</strong>? Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setModalEliminar(null)}>Cancelar</button>
          <button className="btn btn-danger" onClick={confirmarEliminar}>Eliminar</button>
        </div>
      </Modal>

      <Modal abierto={!!modalDestacar} titulo="Destacar Oferta" onCerrar={() => setModalDestacar(null)}>
        <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
          ¿Destacar <strong>{modalDestacar?.titulo}</strong> por 24 horas? Aparecerá al inicio del mural con un resplandor verde.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setModalDestacar(null)}>Cancelar</button>
          <button className="btn btn-accent" onClick={confirmarDestacar}>Destacar por 24 h</button>
        </div>
      </Modal>
    </div>
  );
}
