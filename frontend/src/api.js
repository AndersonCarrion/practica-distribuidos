const API_SERVERS = import.meta.env.VITE_API_SERVERS
  ? import.meta.env.VITE_API_SERVERS.split(',')
  : ['/api'];

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  for (const base of API_SERVERS) {
    try {
      const res = await fetch(`${base}${endpoint}`, { ...options, headers });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, ...data };
      return data;
    } catch (err) {
      if (err.status) throw err;
      console.warn(`[api] ${base}${endpoint} falló:`, err.message);
    }
  }
  throw new Error('Todos los servidores de API están caídos');
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
    try {
      const res = await fetch(`${base}/upload/logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, ...data };
      return data;
    } catch (err) {
      if (err.status) throw err;
      console.warn(`[api] ${base}/upload/logo falló:`, err.message);
    }
  }
  throw new Error('Todos los servidores de API están caídos');
}
