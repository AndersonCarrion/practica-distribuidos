const API_SERVERS = import.meta.env.VITE_API_SERVERS
  ? import.meta.env.VITE_API_SERVERS.split(',').sort(() => Math.random() - 0.5)
  : ['/api'];

console.log('[api] Servidores cargados (orden aleatorio):', API_SERVERS);

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  for (const base of API_SERVERS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Aumentado a 10s timeout

    try {
      const res = await fetch(`${base}${endpoint}`, { 
        ...options, 
        headers,
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (!res.ok) throw { status: res.status, ...data };
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.status) throw err; // Si es un error de la API (4xx, 5xx), propagar
      
      if (err.name === 'AbortError') {
        console.warn(`[api] ${base}${endpoint} tiempo de espera agotado (timeout)`);
      } else {
        console.warn(`[api] ${base}${endpoint} falló o error de red:`, err.message);
      }
      // Continuar al siguiente servidor en el bucle
    }
  }
  throw new Error('Todos los servidores de API están caídos o fuera de línea');
}

export function get(endpoint) {
  return request(endpoint, { method: 'GET' });
}

export function post(endpoint, body) {
  return request(endpoint, { method: 'POST', body: JSON.stringify(body) });
}

export function put(endpoint, body) {
  return request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
}

export function del(endpoint) {
  return request(endpoint, { method: 'DELETE' });
}

export async function uploadLogo(file) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('logo', file);

  for (const base of API_SERVERS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s para uploads

    try {
      const res = await fetch(`${base}/upload/logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok) throw { status: res.status, ...data };
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.status) throw err;
      console.warn(`[api] ${base}/upload/logo falló:`, err.message);
    }
  }
  throw new Error('Todos los servidores de API están caídos');
}
