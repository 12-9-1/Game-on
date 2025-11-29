# Estructura del Proyecto Backend Node.js

## Árbol de Directorios

```
server/
├── src/
│   ├── index.js                      # Archivo principal - Inicializa Express, Socket.IO y MongoDB
│   ├── config/
│   │   └── database.js               # Configuración de conexión a MongoDB
│   ├── models/
│   │   └── User.js                   # Esquema de usuario (Mongoose)
│   ├── routes/
│   │   └── auth.js                   # Rutas HTTP: /register, /login, /protected
│   ├── middleware/
│   │   └── auth.js                   # Middleware de autenticación JWT
│   ├── services/
│   │   └── aiService.js              # Servicio de generación de preguntas (Open Trivia DB)
│   └── sockets/
│       └── socketHandler.js          # Manejador de eventos Socket.IO
├── .env                              # Variables de entorno (no versionar)
├── .env.example                      # Plantilla de variables de entorno
├── .gitignore                        # Archivos a ignorar en Git
├── package.json                      # Dependencias y scripts
├── package-lock.json                 # Lock file de dependencias
├── README.md                         # Documentación completa
├── QUICKSTART.md                     # Guía de inicio rápido
├── COMPATIBILITY.md                  # Notas de compatibilidad Flask → Node.js
└── STRUCTURE.md                      # Este archivo
```

## Descripción de Archivos

### `src/index.js`
**Propósito**: Punto de entrada principal de la aplicación

**Responsabilidades**:
- Cargar variables de entorno
- Inicializar Express
- Configurar CORS
- Inicializar Socket.IO
- Conectar a MongoDB
- Registrar rutas HTTP
- Registrar eventos Socket.IO
- Iniciar servidor HTTP

**Dependencias**: express, socket.io, cors, dotenv, mongoose

---

### `src/config/database.js`
**Propósito**: Gestionar conexión a MongoDB

**Responsabilidades**:
- Conectar a MongoDB usando Mongoose
- Manejar errores de conexión
- Exportar función de conexión

**Dependencias**: mongoose

---

### `src/models/User.js`
**Propósito**: Definir esquema de usuario en MongoDB

**Campos**:
- `public_id` (String, único): UUID del usuario
- `name` (String): Nombre del usuario
- `email` (String, único): Email del usuario
- `password` (String): Contraseña hasheada
- `created_at` (Date): Fecha de creación

**Dependencias**: mongoose

---

### `src/routes/auth.js`
**Propósito**: Definir rutas de autenticación HTTP

**Rutas**:
- `POST /register`: Registrar nuevo usuario
- `POST /login`: Iniciar sesión
- `GET /protected`: Ruta protegida (requiere JWT)

**Responsabilidades**:
- Validar entrada
- Hashear contraseñas
- Generar JWT
- Verificar credenciales
- Proteger rutas

**Dependencias**: express, jsonwebtoken, bcryptjs, uuid, mongoose

---

### `src/middleware/auth.js`
**Propósito**: Middleware para proteger rutas con JWT

**Responsabilidades**:
- Leer JWT del header `x-access-token`
- Decodificar JWT
- Buscar usuario en MongoDB
- Inyectar usuario en request

**Dependencias**: jsonwebtoken, mongoose

---

### `src/services/aiService.js`
**Propósito**: Generar preguntas de trivia desde Open Trivia Database

**Funciones**:
- `getQuestionFromOpenTDB()`: Obtiene una pregunta de la API
- `generateSingleQuestionSync()`: Genera una pregunta individual
- `generateRoundQuestions()`: Genera múltiples preguntas para una ronda

**Responsabilidades**:
- Llamar a Open Trivia Database API
- Decodificar entidades HTML
- Mezclar opciones
- Manejar rate limiting
- Manejar errores

**Dependencias**: axios

---

### `src/sockets/socketHandler.js`
**Propósito**: Manejar todos los eventos Socket.IO

**Almacenamiento en Memoria**:
- `lobbies`: Diccionario de lobbies activos
- `userLobbies`: Mapeo de socket_id a lobby_id
- `activeQuestions`: Preguntas activas por lobby
- `playerAnswers`: Respuestas de jugadores por lobby
- `questionQueue`: Cola de preguntas por lobby
- `questionTimers`: Temporizadores de preguntas
- `generationThreads`: Threads de generación de preguntas

**Eventos Recibidos**:
- Lobby: `create_lobby`, `join_lobby`, `leave_lobby`, `get_lobbies`, `toggle_ready`
- Game: `start_game`, `submit_answer`, `time_up`, `request_new_round`, `ready_for_new_round`, `back_to_lobby`
- Chat: `send_chat_message`
- Util: `get_lobby_update`

**Eventos Emitidos**:
- Connection: `connected`
- Lobby: `lobby_created`, `lobby_joined`, `lobby_left`, `player_joined`, `player_left`, `player_ready_changed`, `lobbies_list`, `lobby_updated`
- Game: `game_started`, `new_question`, `answer_result`, `player_answered`, `round_ended`, `waiting_new_round`, `new_round_started`, `returned_to_lobby`
- Chat: `chat_message`
- Error: `error`

**Responsabilidades**:
- Gestionar ciclo de vida de lobbies
- Gestionar estado de jugadores
- Gestionar preguntas y respuestas
- Calcular puntuaciones
- Manejar temporizadores
- Emitir eventos a clientes

**Dependencias**: aiService

---

### `.env.example`
**Propósito**: Plantilla de variables de entorno

**Variables**:
- `MONGODB_URI`: URI de conexión a MongoDB
- `JWT_SECRET`: Clave secreta para firmar JWTs
- `PORT`: Puerto del servidor
- `NODE_ENV`: Ambiente (development/production)
- `FRONTEND_URL`: URL del frontend para CORS

---

### `package.json`
**Propósito**: Definir dependencias y scripts del proyecto

**Scripts**:
- `npm start`: Ejecutar en producción
- `npm run dev`: Ejecutar en desarrollo (con nodemon)

**Dependencias Principales**:
- `express`: Framework web
- `socket.io`: Comunicación en tiempo real
- `cors`: Manejo de CORS
- `dotenv`: Cargar variables de entorno
- `mongoose`: ODM para MongoDB
- `jsonwebtoken`: Manejo de JWT
- `bcryptjs`: Hashing de contraseñas
- `uuid`: Generación de UUIDs
- `axios`: Cliente HTTP

---

## Flujo de Datos

### Autenticación
```
Cliente
  ↓
POST /register o /login
  ↓
Express Route (auth.js)
  ↓
Validar entrada
  ↓
Buscar/Crear usuario en MongoDB
  ↓
Generar JWT
  ↓
Responder con token y usuario
  ↓
Cliente almacena token
```

### Socket.IO - Crear Lobby
```
Cliente emite: create_lobby
  ↓
Socket Handler recibe evento
  ↓
Crear lobby en memoria
  ↓
Agregar jugador a lobby
  ↓
Unir socket a room
  ↓
Emitir: lobby_created
  ↓
Cliente recibe confirmación
```

### Socket.IO - Iniciar Juego
```
Host emite: start_game
  ↓
Socket Handler verifica permisos
  ↓
Generar primera pregunta
  ↓
Inicializar estado del juego
  ↓
Emitir: game_started
  ↓
Emitir: new_question (después de 2s)
  ↓
Iniciar temporizador de 32s
  ↓
Clientes reciben pregunta
```

### Socket.IO - Enviar Respuesta
```
Jugador emite: submit_answer
  ↓
Socket Handler verifica validez
  ↓
Calcular si es correcta
  ↓
Calcular puntos (base + bonus)
  ↓
Actualizar score del jugador
  ↓
Emitir: answer_result (al jugador)
  ↓
Emitir: player_answered (a todos)
  ↓
Emitir: lobby_updated (a todos)
  ↓
¿Ganó alguien?
  ├─ Sí → Emitir: round_ended
  └─ No → ¿Todos respondieron?
      ├─ Sí → Enviar siguiente pregunta
      └─ No → Esperar temporizador
```

## Dependencias Externas

### APIs
- **Open Trivia Database**: https://opentdb.com/api.php
  - Proporciona preguntas de trivia
  - Rate limit: ~1 pregunta cada 5 segundos

### Servicios
- **MongoDB**: Base de datos NoSQL
  - Almacena usuarios
  - Puede ser local o en Atlas (nube)

## Configuración de Entorno

### Desarrollo
```env
MONGODB_URI=mongodb://localhost:27017/game_on_db
JWT_SECRET=dev-secret-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Producción
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/game_on_db
JWT_SECRET=clave-secreta-muy-segura-aleatoria
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://tudominio.com
```

## Patrones de Diseño

### 1. Separación de Responsabilidades
- `routes/`: Lógica de rutas HTTP
- `sockets/`: Lógica de eventos Socket.IO
- `services/`: Lógica de negocio (generación de preguntas)
- `middleware/`: Lógica transversal (autenticación)
- `models/`: Definición de datos

### 2. Almacenamiento en Memoria
Los lobbies y estado del juego se almacenan en memoria (no en BD) para:
- Mejor rendimiento
- Datos en tiempo real
- Simplicidad

**Nota**: Los lobbies se pierden si el servidor se reinicia.

### 3. Eventos Socket.IO
Cada evento tiene un manejador que:
1. Valida el socket
2. Valida el lobby
3. Valida permisos
4. Ejecuta lógica
5. Emite eventos de respuesta

### 4. Temporizadores
Los temporizadores se usan para:
- Avanzar automáticamente cuando se acaba el tiempo
- Marcar jugadores que no respondieron
- Dar tiempo para ver explicaciones

## Seguridad

### Autenticación
- JWT con expiración de 1 día
- Contraseñas hasheadas con bcryptjs
- Validación de entrada en todas las rutas

### CORS
- Configurado para permitir solo `FRONTEND_URL`
- Credenciales habilitadas
- Headers específicos permitidos

### Validación
- Validación de campos obligatorios
- Validación de permisos (solo host puede iniciar)
- Validación de estado (no puedes unirte a un lobby en juego)

## Performance

### Optimizaciones
- Preguntas pre-generadas en background
- Cola de preguntas para evitar delays
- Temporizadores eficientes
- Índices en MongoDB para búsquedas rápidas

### Limitaciones
- Rate limiting de Open Trivia DB (~1 pregunta/5s)
- Almacenamiento en memoria (limitado por RAM)
- Sin persistencia de lobbies

## Escalabilidad Futura

Para escalar a múltiples servidores:

1. **Redis**: Para almacenamiento distribuido de lobbies
2. **Message Queue**: Para comunicación entre servidores
3. **Database**: Persistir lobbies en MongoDB
4. **Load Balancer**: Distribuir conexiones entre servidores

Ejemplo con Redis:
```javascript
const redis = require('redis');
const adapter = require('@socket.io/redis-adapter');

const io = socketIO(server);
const pubClient = redis.createClient();
const subClient = pubClient.duplicate();

io.adapter(adapter(pubClient, subClient));
```

## Debugging

### Logs Útiles
```javascript
// En socketHandler.js
console.log(`Cliente conectado: ${socket.id}`);
console.log(`Lobby creado: ${lobbyId}`);
console.log(`Pregunta enviada: #${questionNumber}`);
console.log(`Respuesta recibida: ${isCorrect ? 'Correcta' : 'Incorrecta'}`);
```

### Herramientas
- **Node DevTools**: `node --inspect src/index.js`
- **MongoDB Compass**: Visualizar datos en MongoDB
- **Socket.IO DevTools**: Extensión del navegador para Socket.IO

## Próximos Pasos

1. Implementar persistencia de lobbies en MongoDB
2. Agregar traducción de preguntas
3. Agregar sistema de ranking
4. Agregar salas privadas con contraseña
5. Agregar estadísticas de jugadores
6. Implementar Redis para escalabilidad
