# practica-distribuidos

Demo educativa: 3 máquinas LAN, cada una con Nginx + Express + MongoDB (replica set). Nginx balancea `/api/` entre backends.

## Stack

| Capa | Tecnología | Puerto |
|---|---|---|
| Frontend | React + Vite (build estático) | `:80` — Nginx sirve `dist/` |
| API | Express + Mongoose | `:3000` |
| DB | MongoDB 7.0 | `:27017` — replica set `rs0` |

## Estructura

```
backend/          Express API — server.js (entrypoint)
  routes/         auth, ofertas, interacciones, usuarios, guardados, upload
  models/         Mongoose schemas (Oferta, Usuario, Guardado, Interaccion, Seguidor)
  middleware/     auth.js (JWT), validar.js
  utils/         mailer.js
frontend/         React + Vite SPA
  src/
    api.js        Failover fetch: prueba cada URL de VITE_API_SERVERS hasta encontrar una viva
    main.jsx      Entrypoint
    pages/        Mural, HiloOferta, Login, Registro, Auth, Guardados, Dashboard, Recuperar
    components/   Navbar, TarjetaOferta, Filtros, Modal, CargarMas
    context/      AuthContext (JWT token)
nginx/            nginx.conf (upstream backend_servers, proxy `/api/` + `/uploads`, SPA fallback)
```

## ⚠️ Requisito crítico: `.env` en raíz

`docker-compose.yml` usa `NODE_NAME`, `MAQUINA1_IP`, `MAQUINA2_IP`, `MAQUINA3_IP`.  
Sin `.env` las variables quedan vacías y MongoDB falla con `MongoParseError`.

Cada PC necesita su `.env`:

```
NODE_NAME=Nodo-A                    # único por máquina
MAQUINA1_IP=192.168.18.11
MAQUINA2_IP=192.168.18.59
MAQUINA3_IP=192.168.18.11           # si hay 2 PCs, duplicar IP; actualizar al agregar la 3ra
```

## Comandos

```bash
# Desarrollo local (requiere MongoDB en localhost)
cd backend;  npm install;  NODE_NAME=Nodo-Local node server.js
cd frontend; npm install;  npm run dev            # Vite dev server :5173

# Producción (Docker)
cd frontend; npm install; npm run build            # genera frontend/dist/
cd ..; docker-compose up --build                   # levanta nginx:80, backend:3000, mongo:27017

# Debug rápido de contenedores
docker-compose pause/kill backend   # simular caída instantánea
docker-compose unpause/start backend

# MongoDB shell (dentro del contenedor)
docker-compose exec mongo mongosh --eval "use muraltech; db.usuarios.find().pretty()"
```

## Nginx como balanceador

`nginx/nginx.conf` tiene un `upstream backend_servers` con las IPs de los 3 backends.
Toda ruta `/api/` y `/uploads` se proxy reversa contra ese upstream (round-robin).

Agregar o quitar servidores del upstream y rebuildear Nginx.

## Failover client-side (respaldo)

`frontend/src/api.js` itera sobre `VITE_API_SERVERS` (CSV de URLs).  
Si falla el Nginx de una PC, salta al siguiente. Si todos fallan, lanza error.

Configurar vía `frontend/.env.production` (producción) o `frontend/.env` (desarrollo):

```
VITE_API_SERVERS=http://192.168.18.11:80/api,http://192.168.18.59:80/api
```

## Inicializar replica set (1 vez)

```bash
docker-compose exec mongo mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: '192.168.18.11:27017' },
    { _id: 1, host: '192.168.18.59:27017' }
  ]
})"
```

Al agregar la PC3: `rs.add('192.168.18.XX:27017')` + actualizar `nginx.conf` y `.env`.

## Notas

- **No hay tests, linter ni typecheck** en el proyecto.
- `docker-compose.yml` tiene healthcheck en mongo; `backend` espera `condition: service_healthy`.
- MongoDB replica set election timeout ~10s al perder un nodo.
- Para vaciar datos: `docker-compose exec mongo mongosh --eval "use muraltech; db.dropDatabase()"`.
