# 🕹️ Battle Quiz Arena

<div align="center">

<img src="/frontend/public/logo-arcade.svg" alt="Logo Battle Quiz Arena" width="300"/>

</div>

## 🚀 Descripción

Juego multijugador de trivia en tiempo real con lobbys, ranking global, poderes por pregunta y chat. Backend en Python (Flask + Flask‑SocketIO), frontend en React (Vite), base de datos en MongoDB, autenticación con JWT y comunicación en tiempo real con Socket.IO. Las preguntas se obtienen y traducen automáticamente desde Open Trivia DB al español.

## 🛠️ Tecnologías Utilizadas

<div align="center">

| Tecnologías                                                                                                       | Descripción                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)               | Biblioteca de JavaScript para crear interfaces de usuario interactivas y dinámicas.                          |
| ![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)                  | Herramienta de construcción rápida y moderna para proyectos web.                                             |
| ![Css3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)                   | Lenguaje de estilos en cascada que controla la presentación visual del DOM                                   |
| ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)             | Plataforma para desplegar aplicaciones web modernas con soporte para frontend y backend.                     |
| ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)          | Base de datos NoSQL orientada a documentos, utilizada para almacenar la información de usuarios y productos. |
| ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)      | Sistema de autenticación basado en tokens para proteger rutas y gestionar sesiones de usuario.               |

</div>

## 🖥️ Demostración

<div align="center">

<img src="" alt="Captura de la demo" width="600"/>

Ver Demo en Vivo: https://game-on-woad.vercel.app/

</div>

## Estructura del proyecto
```
Game-on/
├─ backend/
│  ├─ main.py              # App Flask, CORS, Socket.IO y rutas de auth
│  ├─ sockets.py           # Eventos de lobbys, juego, poderes y chat
│  ├─ auth.py              # Registro/Login, JWT y ranking global
│  ├─ ai_service.py        # Open Trivia DB + traducción al español
│  ├─ powers.py            # Sistema de poderes (50/50, doble puntos, tiempo extra)
│  ├─ requirements.txt     # Dependencias Python
│  ├─ wsgi.py, start.sh    # Entrypoint Gunicorn (eventlet)
│  └─ tests…               # Tests unitarios de poderes
├─ frontend/
│  ├─ src/
│  │  ├─ main.jsx, App.jsx           
│  │  ├─ socket.js                   # Cliente Socket.IO
│  │  ├─ contexts/AuthContext.jsx    # Sesión y auth (JWT)
│  │  ├─ pages/{Home,Lobby,Game,Profile}
│  │  ├─ pages/ranking/RankingGlobal.jsx
│  │  └─ components/{Navbar,GameSidebar,PowersPanel,…}
│  └─ package.json, vite.config.js
├─ vercel.json            # Build/preview del frontend
└─ README.md              # Este documento
```

## Funcionalidades clave
- Creación y unión a lobbys con host, capacidad y estado ready por jugador.
- Inicio de juego cuando todos están listos (excepto host) y objetivo de puntos.
- Rondas de preguntas con temporizador, explicación y puntuación por rapidez.
- Poderes por pregunta: 50/50, doble puntos y tiempo extra (con coste en puntos).
- Ranking en vivo dentro del juego y ranking global (partidas ganadas) por usuario.
- Chat de lobby en tiempo real.
- Autenticación JWT (registro/login) y persistencia de sesión.
- Cada victoria suma para el Ranking Global

## Variables de entorno
### Backend (`backend/.env`)
- `MONGODB_URI` (ej. `mongodb://localhost:27017/`)
- `JWT_SECRET`
- `URL_FRONTEND` (ej. `http://localhost:5173`)
- `PORT` (ej. `5000`)
- `ALLOW_ALL_CORS` (`1/true/yes` para permitir todos los orígenes en desarrollo)

### Frontend (`frontend/.env`)
- `VITE_URL_BACKEND` (ej. `http://localhost:5000`)
- Nota: `Profile.jsx` usa `VITE_BACKEND_URL`. Para evitar confusiones, definir ambas apuntando al backend.

## Puesta en marcha (local)
### Requisitos
- Node.js 18+
- Python 3.10+
- MongoDB en ejecución

### Backend
1. `cd backend`
2. Crear `.env` y configurar variables (ver arriba).
3. Crear entorno virtual y dependencias:
   - Windows PowerShell: `python -m venv .venv && .\.venv\Scripts\Activate.ps1 && pip install -r requirements.txt`
4. Iniciar servidor:
   - Desarrollo: `python main.py`
   - Producción (eventlet/gunicorn): `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 wsgi:application`

### Frontend
1. `cd frontend`
2. `npm install`
3. Crear `.env` con `VITE_URL_BACKEND` apuntando al backend.
4. Desarrollo: `npm run dev`
5. Build: `npm run build` y `npm run preview`


## Flujo de juego
1. Crear/unirse a un lobby y marcar “listo”.
2. El host inicia la partida → se genera la primera pregunta y se arranca el generador en segundo plano.
3. Cada pregunta tiene tiempo límite, puntuación por rapidez, explicación y poderes disponibles.
4. Al llegar al puntaje objetivo o terminar preguntas, se cierra la ronda y se muestran resultados.
5. Si el ganador está autenticado, se incrementa su contador de partidas ganadas (ranking global).
6. El host puede volver al lobby o iniciar una nueva ronda.

## Seguridad y buenas prácticas
- JWT firmado con `SECRET_KEY`. En producción, usar secretos fuertes y almacenamiento seguro del token.
- CORS restringido a orígenes confiables; en desarrollo puede habilitarse `ALLOW_ALL_CORS`.
- Evitar exponer credenciales en el cliente; usar `.env` y despliegues seguros.

## Pruebas
- Tests unitarios del sistema de poderes en `backend/test_powers.py`.
- Ejecutar (modo simple):
  - `cd backend`
  - `python test_powers.py`

## Despliegue
- Frontend: Vercel (`vercel.json` realiza build y preview desde `frontend`).
- Backend: Render: preparado para Eventlet + Gunicorn (`wsgi.py`, `start.sh`).

## 💬 Integrantes

- Mateo Lopez Yapur
- Lia Lisbet Costilla
- Alvaro Maximiliano Cordoba
- Tomas Pando

---

<div align="center">
  
Desarrollado con ❤️. 
<br/> Agradecimientos a nuestro profesor Ezequiel Muñoz. <br/>
<a href="#-Battle-Quiz-Arena">⬆️ Volver arriba ⬆️</a>
  
<div/>