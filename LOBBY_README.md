# 🎮 Sistema de Lobbies - Game On

Sistema de lobbies multiplayer con Socket.IO, diseñado con paleta de colores azul.

## 🚀 Características

- ✅ Crear lobbies personalizados
- ✅ Unirse a lobbies existentes con código
- ✅ Ver lobbies disponibles en tiempo real
- ✅ Sistema de "Ready" para jugadores
- ✅ Host puede iniciar el juego
- ✅ Diseño moderno con paleta azul
- ✅ Responsive design

## 📋 Requisitos

### Backend (Python)
- Python 3.8+
- pip

### Frontend (React)
- Node.js 16+
- npm o yarn

## 🔧 Instalación

### Backend

1. Navega a la carpeta del backend:
```bash
cd backend
```

2. Instala las dependencias:
```bash
pip install -r requirements.txt
```

3. Crea un archivo `.env` con las siguientes variables:
```env
MONGODB_URI=tu_uri_de_mongodb
JWT_SECRET=tu_secreto_jwt
```

4. Inicia el servidor:
```bash
python main.py
```

El servidor estará corriendo en `http://localhost:5000`

### Frontend

1. Navega a la carpeta del frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

El frontend estará corriendo en `http://localhost:5173`

## 🎯 Uso

### Crear un Lobby

1. Haz clic en "➕ Crear Lobby"
2. Ingresa tu nombre
3. Selecciona el número máximo de jugadores (2-8)
4. Haz clic en "Crear"
5. Comparte el código del lobby con otros jugadores

### Unirse a un Lobby

**Opción 1: Con código**
1. Haz clic en "🔗 Unirse con Código"
2. Ingresa tu nombre
3. Ingresa el código del lobby
4. Haz clic en "Unirse"

**Opción 2: Desde la lista**
1. Busca el lobby en la lista de "Lobbies Disponibles"
2. Haz clic en "🚀 Unirse"
3. Ingresa tu nombre cuando se solicite

### Dentro del Lobby

**Como Jugador:**
- Haz clic en "⏳ Marcar como Listo" cuando estés preparado
- Espera a que el host inicie el juego

**Como Host:**
- Espera a que todos los jugadores estén listos
- Haz clic en "🚀 Iniciar Juego" cuando todos estén preparados

## 🎨 Paleta de Colores

El diseño utiliza una paleta de colores azul:

- **Azul Primario**: `#3b82f6`
- **Azul Secundario**: `#2563eb`
- **Azul Oscuro**: `#1e3a8a`
- **Fondo Primario**: `#0a0e1a`
- **Fondo Secundario**: `#111827`

## 📡 Eventos de Socket.IO

### Cliente → Servidor

- `create_lobby`: Crear un nuevo lobby
- `join_lobby`: Unirse a un lobby existente
- `leave_lobby`: Salir del lobby actual
- `get_lobbies`: Obtener lista de lobbies disponibles
- `toggle_ready`: Cambiar estado de "listo"
- `start_game`: Iniciar el juego (solo host)

### Servidor → Cliente

- `connected`: Confirmación de conexión
- `lobby_created`: Lobby creado exitosamente
- `lobby_joined`: Unido al lobby exitosamente
- `lobby_left`: Saliste del lobby
- `lobbies_list`: Lista de lobbies disponibles
- `player_joined`: Un jugador se unió al lobby
- `player_left`: Un jugador salió del lobby
- `player_ready_changed`: Estado de "listo" cambió
- `game_started`: El juego ha comenzado
- `error`: Error en alguna operación

## 🏗️ Estructura del Proyecto

```
Game-on/
├── backend/
│   ├── main.py          # Servidor Flask + Socket.IO
│   ├── sockets.py       # Lógica de eventos Socket.IO
│   └── requirements.txt # Dependencias Python
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── LobbyList.jsx     # Lista de lobbies
    │   │   ├── LobbyList.css
    │   │   ├── LobbyRoom.jsx     # Sala de lobby
    │   │   └── LobbyRoom.css
    │   ├── App.jsx               # Componente principal
    │   ├── App.css
    │   └── index.css             # Estilos globales
    └── package.json
```

## 🔜 Próximas Funcionalidades

- [ ] Persistencia de lobbies en MongoDB
- [ ] Sistema de chat en el lobby
- [ ] Configuración de partida personalizada
- [ ] Historial de partidas
- [ ] Sistema de ranking

## 🐛 Solución de Problemas

### El frontend no se conecta al backend

1. Verifica que el backend esté corriendo en `http://localhost:5000`
2. Revisa la consola del navegador para ver errores
3. Asegúrate de que CORS esté habilitado en el backend

### Los lobbies no se actualizan

1. Verifica la conexión de Socket.IO en la consola del navegador
2. Revisa que no haya errores en la consola del servidor
3. Intenta refrescar la página

## 📝 Notas

- Los lobbies se almacenan en memoria, se perderán al reiniciar el servidor
- El código del lobby es único y tiene 8 caracteres
- Máximo 8 jugadores por lobby
- El host puede iniciar el juego solo si todos están listos

---

¡Disfruta del sistema de lobbies! 🎮
