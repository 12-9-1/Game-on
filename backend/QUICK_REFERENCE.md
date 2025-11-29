# Referencia Rápida - Backend Node.js

## 🚀 Inicio Rápido (3 pasos)

```bash
# 1. Instalar
cd server && npm install

# 2. Configurar
cp .env.example .env

# 3. Ejecutar
npm run dev
```

## 📍 URLs

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/register` | POST | Registrar usuario |
| `/login` | POST | Iniciar sesión |
| `/protected` | GET | Ruta protegida (requiere JWT) |

## 🔐 Headers

```javascript
// Para rutas protegidas
{
  'x-access-token': 'tu_token_jwt'
}
```

## 📡 Socket.IO - Eventos Principales

### Emitir (Cliente → Servidor)

```javascript
// Lobbies
socket.emit('create_lobby', { player_name, max_players })
socket.emit('join_lobby', { lobby_id, player_name })
socket.emit('leave_lobby')
socket.emit('get_lobbies')
socket.emit('toggle_ready')

// Juego
socket.emit('start_game')
socket.emit('submit_answer', { answer_index })
socket.emit('time_up')
socket.emit('request_new_round')
socket.emit('ready_for_new_round')
socket.emit('back_to_lobby')

// Chat
socket.emit('send_chat_message', { message })

// Util
socket.emit('get_lobby_update')
```

### Escuchar (Servidor → Cliente)

```javascript
// Conexión
socket.on('connected', (data) => {})
socket.on('error', (data) => {})

// Lobbies
socket.on('lobby_created', (data) => {})
socket.on('lobby_joined', (data) => {})
socket.on('lobby_left', (data) => {})
socket.on('player_joined', (data) => {})
socket.on('player_left', (data) => {})
socket.on('player_ready_changed', (data) => {})
socket.on('lobbies_list', (data) => {})
socket.on('lobby_updated', (data) => {})

// Juego
socket.on('game_started', (data) => {})
socket.on('new_question', (data) => {})
socket.on('answer_result', (data) => {})
socket.on('player_answered', (data) => {})
socket.on('round_ended', (data) => {})
socket.on('waiting_new_round', (data) => {})
socket.on('new_round_started', (data) => {})
socket.on('returned_to_lobby', (data) => {})

// Chat
socket.on('chat_message', (data) => {})
```

## 📦 Estructura de Datos

### Lobby
```javascript
{
  id: string,
  host: socket_id,
  players: [{ socket_id, name, is_host, ready, score }],
  max_players: number,
  status: 'waiting' | 'playing' | 'round_finished' | 'waiting_new_round',
  win_score: number,
  created_at: ISO string
}
```

### Pregunta
```javascript
{
  question: string,
  options: [string, string, string, string],
  difficulty: 'easy' | 'medium' | 'hard',
  category: string,
  question_number: number,
  time_limit: 30
}
```

### Respuesta
```javascript
{
  is_correct: boolean,
  points: number,
  total_score: number,
  correct_answer: number,
  explanation: string
}
```

## 🔧 Variables de Entorno

```env
MONGODB_URI=mongodb://localhost:27017/game_on_db
JWT_SECRET=dev-secret-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## 📝 Ejemplos de Código

### Conectar Socket.IO
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connected', (data) => {
  console.log(data.message);
});
```

### Registrar Usuario
```javascript
const response = await fetch('http://localhost:5000/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, password })
});

const { token, user } = await response.json();
localStorage.setItem('token', token);
```

### Crear Lobby
```javascript
socket.emit('create_lobby', {
  player_name: 'Juan',
  max_players: 4
});

socket.on('lobby_created', (data) => {
  console.log('Lobby ID:', data.lobby.id);
});
```

### Enviar Respuesta
```javascript
socket.emit('submit_answer', {
  answer_index: 0 // Índice de la opción seleccionada
});

socket.on('answer_result', (data) => {
  console.log('¿Correcto?', data.is_correct);
  console.log('Puntos:', data.points);
  console.log('Total:', data.total_score);
});
```

## 🐛 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "Cannot find module" | `npm install` |
| "EADDRINUSE :::5000" | Cambia PORT en .env o detén proceso |
| "Cannot connect to MongoDB" | Inicia MongoDB o revisa MONGODB_URI |
| "Socket.IO no conecta" | Verifica FRONTEND_URL en .env |
| "Token is invalid" | Verifica JWT_SECRET en .env |

## 📊 Flujo de Juego

```
1. Usuario se registra/login
2. Usuario crea o se une a lobby
3. Host inicia juego
4. Servidor envía pregunta
5. Jugadores envían respuestas
6. Servidor calcula puntos
7. Si alguien llega a 10,000 puntos → Fin
8. Si no → Siguiente pregunta
9. Después de ronda → Nueva ronda o volver al lobby
```

## 🎯 Checklist de Desarrollo

- [ ] `npm install` completado
- [ ] `.env` configurado
- [ ] MongoDB corriendo
- [ ] `npm run dev` ejecutándose
- [ ] Frontend conecta a Socket.IO
- [ ] Registro funciona
- [ ] Login funciona
- [ ] Crear lobby funciona
- [ ] Unirse a lobby funciona
- [ ] Iniciar juego funciona
- [ ] Preguntas se cargan
- [ ] Respuestas se registran
- [ ] Puntos se calculan
- [ ] Chat funciona

## 📚 Documentación Completa

- `README.md` - Documentación completa
- `QUICKSTART.md` - Inicio rápido (5 min)
- `COMPATIBILITY.md` - Compatibilidad Flask ↔ Node.js
- `STRUCTURE.md` - Arquitectura del proyecto
- `FRONTEND_INTEGRATION.md` - Integración con React
- `MIGRATION_SUMMARY.md` - Resumen de migración

## 🔗 Enlaces Útiles

- Node.js: https://nodejs.org/
- Express: https://expressjs.com/
- Socket.IO: https://socket.io/
- MongoDB: https://www.mongodb.com/
- Mongoose: https://mongoosejs.com/
- Open Trivia DB: https://opentdb.com/

## 💡 Tips

1. **Desarrollo**: Usa `npm run dev` para auto-reload con nodemon
2. **Logs**: Abre consola del servidor para ver eventos en tiempo real
3. **Testing**: Usa Postman para probar rutas HTTP
4. **Debugging**: Abre F12 en navegador para ver logs de Socket.IO
5. **Producción**: Cambia JWT_SECRET a algo seguro

## 🆘 Soporte Rápido

```bash
# Ver versión de Node.js
node --version

# Ver versión de npm
npm --version

# Limpiar cache de npm
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Ver procesos usando puerto 5000
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows
```

## ✅ Verificación Final

```bash
# 1. Servidor corriendo
curl http://localhost:5000

# 2. Registrar usuario
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test"}'

# 3. Login
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# 4. Ruta protegida (reemplaza TOKEN)
curl -X GET http://localhost:5000/protected \
  -H "x-access-token: TOKEN"
```

¡Listo! 🚀
