# Game-On Backend - Node.js

Backend en Node.js para Game-On, un juego de trivia multiplayer en tiempo real con Socket.IO.

## Características

- ✅ Autenticación con JWT
- ✅ Lobbies en tiempo real con Socket.IO
- ✅ Generación de preguntas desde Open Trivia Database
- ✅ Sistema de puntuación y rankings
- ✅ Chat en tiempo real
- ✅ MongoDB para persistencia de datos

## Requisitos Previos

- Node.js >= 14.x
- npm o yarn
- MongoDB (local o Atlas)

## Instalación

1. **Clonar o descargar el proyecto**

```bash
cd server
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Crear un archivo `.env` en la raíz del proyecto `server/`:

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/game_on_db
# O si usas MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/game_on_db

# JWT
JWT_SECRET=tu-clave-secreta-muy-segura

# Server
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
```

## Ejecución

### Modo Desarrollo (con auto-reload)

```bash
npm run dev
```

### Modo Producción

```bash
npm start
```

El servidor estará disponible en `http://localhost:5000`

## Estructura del Proyecto

```
server/
├── src/
│   ├── index.js                 # Archivo principal
│   ├── config/
│   │   └── database.js          # Configuración de MongoDB
│   ├── models/
│   │   └── User.js              # Modelo de usuario
│   ├── routes/
│   │   └── auth.js              # Rutas de autenticación
│   ├── middleware/
│   │   └── auth.js              # Middleware de JWT
│   ├── services/
│   │   └── aiService.js         # Servicio de generación de preguntas
│   └── sockets/
│       └── socketHandler.js     # Manejador de eventos Socket.IO
├── .env.example                 # Ejemplo de variables de entorno
├── package.json
└── README.md
```

## Rutas HTTP

### Autenticación

#### POST `/register`
Registra un nuevo usuario.

**Request:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "public_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

#### POST `/login`
Inicia sesión con un usuario existente.

**Request:**
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "public_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

#### GET `/protected`
Ruta protegida que requiere JWT en el header `x-access-token`.

**Request Headers:**
```
x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "message": "Hello Juan Pérez! This is a protected route."
}
```

## Eventos Socket.IO

### Eventos Recibidos

#### Lobby Management
- `create_lobby` - Crear un nuevo lobby
- `join_lobby` - Unirse a un lobby existente
- `leave_lobby` - Salir del lobby
- `get_lobbies` - Obtener lista de lobbies disponibles
- `toggle_ready` - Cambiar estado de listo
- `get_lobby_update` - Obtener actualización del lobby

#### Game Events
- `start_game` - Iniciar el juego (solo host)
- `submit_answer` - Enviar respuesta a una pregunta
- `time_up` - Notificar que se acabó el tiempo
- `request_new_round` - Solicitar nueva ronda (solo host)
- `ready_for_new_round` - Marcar como listo para nueva ronda
- `back_to_lobby` - Volver al lobby (solo host)

#### Chat
- `send_chat_message` - Enviar mensaje de chat

### Eventos Emitidos

#### Connection
- `connected` - Confirmación de conexión

#### Lobby Events
- `lobby_created` - Lobby creado exitosamente
- `lobby_joined` - Jugador se unió al lobby
- `lobby_left` - Jugador salió del lobby
- `player_joined` - Notificación de nuevo jugador
- `player_left` - Notificación de jugador que se fue
- `player_ready_changed` - Estado de listo cambió
- `lobbies_list` - Lista de lobbies disponibles
- `lobby_updated` - Actualización del estado del lobby

#### Game Events
- `game_started` - Juego iniciado
- `new_question` - Nueva pregunta disponible
- `answer_result` - Resultado de la respuesta del jugador
- `player_answered` - Notificación de jugador que respondió
- `round_ended` - Ronda terminada con resultados
- `waiting_new_round` - Esperando nueva ronda
- `new_round_started` - Nueva ronda iniciada
- `returned_to_lobby` - Volvieron al lobby

#### Chat
- `chat_message` - Nuevo mensaje de chat

#### Errors
- `error` - Error en la operación

## Compatibilidad con Frontend

Este backend es totalmente compatible con el frontend React existente. Los cambios necesarios en el frontend son mínimos:

### Cambios en el Frontend

Solo necesitas actualizar la URL del servidor en tu configuración de Socket.IO:

**Antes (Flask):**
```javascript
const socket = io('http://localhost:5000');
```

**Ahora (Node.js):**
```javascript
const socket = io('http://localhost:5000');
```

La URL es la misma, así que **no necesitas cambios** si ambos servidores corren en el puerto 5000.

### Headers de Autenticación

El backend espera el JWT en el header `x-access-token`:

```javascript
const token = localStorage.getItem('token');
const headers = {
  'x-access-token': token
};
```

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `MONGODB_URI` | URI de conexión a MongoDB | `mongodb://localhost:27017/game_on_db` |
| `JWT_SECRET` | Clave secreta para firmar JWTs | `dev-secret-key` |
| `PORT` | Puerto del servidor | `5000` |
| `NODE_ENV` | Ambiente (development/production) | `development` |
| `FRONTEND_URL` | URL del frontend para CORS | `http://localhost:5173` |

## Desarrollo

### Estructura de Datos en Memoria

El backend mantiene las siguientes estructuras en memoria para el juego:

```javascript
lobbies = {
  'lobby_id': {
    id: string,
    host: socket_id,
    players: [
      {
        socket_id: string,
        name: string,
        is_host: boolean,
        ready: boolean,
        score: number
      }
    ],
    max_players: number,
    status: 'waiting' | 'playing' | 'round_finished' | 'waiting_new_round',
    win_score: number,
    created_at: ISO string
  }
}

userLobbies = {
  'socket_id': 'lobby_id'
}

activeQuestions = {
  'lobby_id': {
    current_question: { question, options, correct_answer, ... },
    question_number: number
  }
}

playerAnswers = {
  'lobby_id': {
    start_time: timestamp,
    answers: {
      'socket_id': { answer_index, is_correct, points, response_time }
    },
    correct_answer: number
  }
}
```

## Troubleshooting

### Error: "Cannot connect to MongoDB"
- Verifica que MongoDB está corriendo
- Revisa la `MONGODB_URI` en `.env`
- Si usas MongoDB Atlas, asegúrate de que tu IP está en la whitelist

### Error: "Token is invalid"
- Verifica que el JWT se está enviando en el header `x-access-token`
- Comprueba que el `JWT_SECRET` es el mismo en `.env`
- Verifica que el token no ha expirado (expira en 1 día)

### Socket.IO no conecta
- Verifica que el puerto 5000 está disponible
- Comprueba que `FRONTEND_URL` en `.env` es correcto
- Revisa la consola del navegador para errores de CORS

## Notas de Producción

Antes de desplegar a producción:

1. Cambia `JWT_SECRET` a una clave segura y aleatoria
2. Usa MongoDB Atlas en lugar de una instancia local
3. Configura `NODE_ENV=production`
4. Actualiza `FRONTEND_URL` con tu dominio real
5. Considera usar un servicio como Heroku, Railway, o Render para hosting

## Licencia

MIT
