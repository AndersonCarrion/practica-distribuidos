const API_SERVERS = import.meta.env.VITE_API_SERVERS
  ? import.meta.env.VITE_API_SERVERS.split(',')
  : ['/api'];

const TIMEOUT_MS = 8000;

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  for (const base of API_SERVERS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const signal = options.signal
      ? anySignal([options.signal, controller.signal])
      : controller.signal;
    try {
      const res = await fetch(`${base}${endpoint}`, { ...options, headers, signal });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, ...data };
      return data;
    } catch (err) {
      if (err.status) throw err;
      if (err.name === 'AbortError') continue;
      console.warn(`[api] ${base}${endpoint} falló:`, err.message);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error('Todos los servidores de API están caídos');
}

function anySignal(signals) {
  const controller = new AbortController();
  for (const sig of signals) {
    if (sig.aborted) { controller.abort(sig.reason); break; }
    sig.addEventListener('abort', () => controller.abort(sig.reason), { once: true });
  }
  return controller.signal;
}

export function get(endpoint, { signal } = {}) {
  return request(endpoint, { method: 'GET', signal });
}

export function post(endpoint, body, { signal } = {}) {
  return request(endpoint, { method: 'POST', body: JSON.stringify(body), signal });
}

export function put(endpoint, body, { signal } = {}) {
  return request(endpoint, { method: 'PUT', body: JSON.stringify(body), signal });
}

export function del(endpoint, { signal } = {}) {
  return request(endpoint, { method: 'DELETE', signal });
}

export async function uploadLogo(file) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('logo', file);

  for (const base of API_SERVERS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${base}/upload/logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        signal: controller.signal
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, ...data };
      return data;
    } catch (err) {
      if (err.status) throw err;
      if (err.name === 'AbortError') continue;
      console.warn(`[api] ${base}/upload/logo falló:`, err.message);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error('Todos los servidores de API están caídos');
}
