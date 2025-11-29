# Notas de Compatibilidad: Flask → Node.js

Este documento describe cómo migrar tu frontend de Flask a Node.js sin cambios significativos.

## Resumen de Cambios

### URLs y Puertos
- **Flask**: `http://localhost:5000`
- **Node.js**: `http://localhost:5000`
- ✅ **No hay cambios necesarios** si ambos corren en el mismo puerto

### Rutas HTTP
Todas las rutas HTTP mantienen la misma estructura:

| Operación | Flask | Node.js | Cambios |
|-----------|-------|---------|---------|
| Registro | `POST /register` | `POST /register` | ✅ Ninguno |
| Login | `POST /login` | `POST /login` | ✅ Ninguno |
| Protegida | `GET /protected` | `GET /protected` | ✅ Ninguno |

### Headers de Autenticación
- **Flask**: `x-access-token`
- **Node.js**: `x-access-token`
- ✅ **Idéntico**

### Respuestas JSON
Las respuestas mantienen la misma estructura:

#### Register (201)
```json
{
  "message": "User registered successfully!",
  "token": "...",
  "user": { "public_id", "name", "email" }
}
```

#### Login (200)
```json
{
  "token": "...",
  "user": { "public_id", "name", "email" }
}
```

#### Protected (200)
```json
{
  "message": "Hello [name]! This is a protected route."
}
```

## Socket.IO - Eventos Idénticos

### Eventos Recibidos (sin cambios)
```javascript
socket.emit('create_lobby', { player_name, max_players })
socket.emit('join_lobby', { lobby_id, player_name })
socket.emit('leave_lobby')
socket.emit('get_lobbies')
socket.emit('toggle_ready')
socket.emit('start_game')
socket.emit('submit_answer', { answer_index })
socket.emit('time_up')
socket.emit('request_new_round')
socket.emit('ready_for_new_round')
socket.emit('back_to_lobby')
socket.emit('send_chat_message', { message })
socket.emit('get_lobby_update')
```

### Eventos Emitidos (sin cambios)
```javascript
socket.on('connected', (data) => {})
socket.on('error', (data) => {})
socket.on('lobbies_list', (data) => {})
socket.on('lobby_created', (data) => {})
socket.on('lobby_joined', (data) => {})
socket.on('lobby_left', (data) => {})
socket.on('player_joined', (data) => {})
socket.on('player_left', (data) => {})
socket.on('player_ready_changed', (data) => {})
socket.on('game_started', (data) => {})
socket.on('lobby_updated', (data) => {})
socket.on('new_question', (data) => {})
socket.on('answer_result', (data) => {})
socket.on('player_answered', (data) => {})
socket.on('round_ended', (data) => {})
socket.on('waiting_new_round', (data) => {})
socket.on('new_round_started', (data) => {})
socket.on('returned_to_lobby', (data) => {})
socket.on('chat_message', (data) => {})
```

## Estructura de Datos - Lobbies

### Estructura del Lobby
```javascript
{
  id: string,                    // ID corto del lobby
  host: string,                  // socket_id del host
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
  status: string,                // 'waiting', 'playing', 'round_finished', 'waiting_new_round'
  win_score: number,             // 10000
  created_at: ISO string
}
```

✅ **Idéntica a Flask**

### Estructura de Preguntas
```javascript
{
  question: string,
  options: [string, string, string, string],
  difficulty: string,            // 'easy', 'medium', 'hard'
  category: string,
  question_number: number,
  time_limit: number,            // 30 segundos
  correct_answer: number         // NO se envía al cliente
}
```

✅ **Idéntica a Flask**

### Estructura de Respuestas
```javascript
{
  is_correct: boolean,
  points: number,
  total_score: number,
  correct_answer: number,
  explanation: string
}
```

✅ **Idéntica a Flask**

## Cambios en el Frontend (Mínimos)

### 1. Actualizar URL de Socket.IO (Opcional)
Si tu frontend tiene la URL hardcodeada:

**Antes:**
```javascript
const socket = io('http://localhost:5000');
```

**Ahora:**
```javascript
const socket = io('http://localhost:5000');
```

Si ambos corren en el mismo puerto, **no necesitas cambiar nada**.

### 2. Verificar Headers de Autenticación
Asegúrate de que tu frontend envía el JWT correctamente:

```javascript
const token = localStorage.getItem('token');
const headers = {
  'x-access-token': token
};

// Para rutas HTTP
fetch('/protected', { headers })

// Para Socket.IO, el token se envía en la respuesta de login
```

### 3. Manejo de Errores (Sin cambios)
Los errores siguen la misma estructura:

```javascript
socket.on('error', (data) => {
  console.error(data.message);
});
```

## Diferencias Técnicas Internas (No afectan el frontend)

| Aspecto | Flask | Node.js |
|--------|-------|---------|
| Framework | Flask + Flask-SocketIO | Express + Socket.IO |
| Base de Datos | MongoDB (PyMongo) | MongoDB (Mongoose) |
| Autenticación | PyJWT | jsonwebtoken |
| Hashing | werkzeug.security | bcryptjs |
| Generación de Preguntas | Open Trivia DB + Google Translate | Open Trivia DB |

**Nota**: El backend Node.js NO incluye traducción automática. Las preguntas se obtienen en inglés de Open Trivia Database. Si necesitas traducción, puedes:

1. Usar Google Translate API (requiere API key)
2. Usar una librería como `translate-google`
3. Mantener las preguntas en inglés

## Checklist de Migración

- [ ] Instalar dependencias: `npm install`
- [ ] Configurar `.env` con MongoDB URI y JWT_SECRET
- [ ] Iniciar MongoDB localmente o en Atlas
- [ ] Ejecutar servidor: `npm run dev`
- [ ] Verificar que Socket.IO conecta correctamente
- [ ] Probar rutas de autenticación
- [ ] Probar eventos de Socket.IO
- [ ] Verificar que el frontend se conecta sin errores

## Troubleshooting

### "Cannot GET /"
- Verifica que el servidor está corriendo en el puerto correcto
- Revisa que `http://localhost:5000` es accesible

### "Token is invalid"
- Verifica que el JWT se envía en el header `x-access-token`
- Comprueba que el token no ha expirado
- Revisa que `JWT_SECRET` es el mismo en `.env`

### Socket.IO no conecta
- Verifica que el servidor está corriendo
- Revisa la consola del navegador para errores de CORS
- Asegúrate que `FRONTEND_URL` en `.env` es correcto

### Preguntas no se cargan
- Verifica que tienes conexión a Internet (Open Trivia DB es una API externa)
- Revisa la consola del servidor para errores
- Espera un poco entre preguntas (hay rate limiting)

## Rollback a Flask

Si necesitas volver a Flask:

1. Detén el servidor Node.js
2. Inicia el servidor Flask: `python main.py`
3. No necesitas cambiar nada en el frontend (misma URL)

## Preguntas Frecuentes

**P: ¿Necesito cambiar la URL del frontend?**
R: No, si ambos servidores corren en `http://localhost:5000`.

**P: ¿Qué pasa con mis datos en MongoDB?**
R: Los datos se mantienen. Ambos backends usan la misma base de datos.

**P: ¿Las preguntas se traducen al español?**
R: No en esta versión. Se obtienen en inglés de Open Trivia Database. Puedes agregar traducción si lo necesitas.

**P: ¿Puedo usar ambos servidores simultáneamente?**
R: No, ambos intentarían usar el puerto 5000. Cambia el puerto de uno en el `.env`.

**P: ¿Qué pasa con los lobbies cuando cambio de servidor?**
R: Se pierden. Los lobbies se almacenan en memoria, no en la base de datos.
