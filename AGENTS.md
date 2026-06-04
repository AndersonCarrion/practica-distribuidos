# practica-distribuidos

Demo educativa de sistema distribuido: React + Vite → Nginx → 3× Node.js/Express → 3× MongoDB (replica set).

## Up & running

```bash
docker-compose up --build
```

Servicio disponible en `http://localhost:80`.

## Arquitectura

| Capa       | Tecnología        | Puertos                                |
|------------|-------------------|----------------------------------------|
| Frontend   | React + Vite      | `:80` → nginx → `frontend:5173`        |
| API        | Express + Mongoose | `:80` → nginx → `backend{1..3}:3000`   |
| DB         | MongoDB 7.0       | replica set `rs0`, 3 nodos `mongo{1..3}:27017` |

- Nginx balancea `/api` round-robin entre los 3 backends y redirige `/` al frontend nginx.conf:`5-8`.
- Backend se identifica con variable `NODE_NAME` (ej. `Nodo-A-3001`) docker-compose.yml:`51-52`.
- MongoDB replica set se inicializa automáticamente al levantar el stack (servicio `mongo-init`).
- Frontend auto-polling cada 3s a `GET /api/mensajes` App.jsx:`34`.
- No hay tests, linter, typechecker, ni codegen configurados.

## Backend

- Entrypoint: `backend/server.js`, puerto fijo `3000`.
- Modelo `Mensaje` (nombre, texto, nodo_procesador, fecha) en MongoDB `muro_distribuido`.
- Endpoints: `GET /api/mensajes`, `POST /api/mensajes`.
- Conexión MongoDB: `mongodb://mongo1:27017,mongo2:27017,mongo3:27017/muro_distribuido?replicaSet=rs0`.

## Frontend

- Entrypoint: `frontend/src/main.jsx` → `App.jsx`.
- Compilado y servido por Vite en modo `dev` (HMR) dentro del contenedor.
- Las requests a `/api/mensajes` son relativas; Nginx resuelve el upstream.

## Modo desarrollo local

```bash
# Backend (requiere MongoDB local o túnel)
cd backend; npm install; NODE_NAME=Nodo-Local node server.js

# Frontend
cd frontend; npm install; npm run dev
```
