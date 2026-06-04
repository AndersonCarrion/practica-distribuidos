import React, { useState, useEffect } from 'react';

// Estilos rápidos en línea para mantener el minimalismo administrativo
const styles = {
  body: { fontFamily: 'system-ui, sans-serif', background: '#f0f2f5', minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  container: { maxWidth: '500px', width: '100%', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '20px', boxSizing: 'border-box' },
  badge: { background: '#007bff', color: "white", padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
  input: { width: '100%', padding: '10px', marginTop: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' },
  button: { width: '100%', padding: '10px', marginTop: '10px', borderRadius: '6px', background: '#28a745', color: "white", fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  card: { background: '#f8f9fa', borderLeft: '4px solid #007bff', padding: '10px', marginTop: '10px', borderRadius: '0 6px 6px 0' },
  meta: { fontSize: '11px', color: '#666', marginTop: '5px' }
};

export default function App() {
  const [mensajes, setMensajes] = useState([]);
  const [nodo, setNodo] = useState('Cargando...');
  const [nombre, setNombre] = useState('');
  const [texto, setTexto] = useState('');

  const fetchMensajes = async () => {
    try {
      // Apuntamos directamente a la ruta relativa, Nginx se encargará del ruteo
      const res = await fetch('/api/mensajes');
      const data = await res.json();
      setMensajes(data.mensajes || []);
      setNodo(data.respondido_por);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMensajes();
    const interval = setInterval(fetchMensajes, 3000);
    return () => clearInterval(interval);
  }, []);

  const enviar = async () => {
    if (!texto) return;
    await fetch('/api/mensajes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, texto })
    });
    setTexto('');
    fetchMensajes();
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h2>Muro de Mensajes (React + Docker)</h2>
        <p>Frontend atendido vía Nginx por: <span style={styles.badge}>{nodo}</span></p>
        <input style={styles.input} type="text" placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
        <textarea style={styles.input} placeholder="Escribe un mensaje..." value={texto} onChange={e => setTexto(e.target.value)} />
        <button style={styles.button} onClick={enviar}>Enviar Mensaje</button>
      </div>

      <div style={styles.container}>
        <h3>Mensajes Replicados</h3>
        {mensajes.map(m => (
          <div key={m._id} style={styles.card}>
            <strong>{m.nombre}</strong>: {m.texto}
            <div style={styles.meta}>Procesado por: {m.nodo_procesador}</div>
          </div>
        ))}
      </div>
    </div>
  );
}