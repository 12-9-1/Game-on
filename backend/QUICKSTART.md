# Inicio Rápido - Game-On Backend Node.js

## 1. Instalación (5 minutos)

### Paso 1: Navegar a la carpeta del servidor
```bash
cd server
```

### Paso 2: Instalar dependencias
```bash
npm install
```

### Paso 3: Crear archivo .env
```bash
cp .env.example .env
```

### Paso 4: Editar .env (opcional)
Si tienes MongoDB local, la configuración por defecto funciona:
```env
MONGODB_URI=mongodb://localhost:27017/game_on_db
JWT_SECRET=dev-secret-key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Si usas MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/game_on_db
JWT_SECRET=tu-clave-secreta
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## 2. Ejecutar el Servidor

### Opción A: Modo Desarrollo (recomendado para desarrollo)
```bash
npm run dev
```

Verás algo como:
```
============================================================
✓ Servidor iniciado en puerto 5000
✓ Frontend URL: http://localhost:5173
✓ MongoDB: mongodb://localhost:27017/game_on_db
============================================================
```

### Opción B: Modo Producción
```bash
npm start
```

## 3. Verificar que Funciona

### Prueba 1: Verificar servidor HTTP
```bash
curl http://localhost:5000
```

Deberías ver:
```json
{"message":"Game-On Backend - Node.js"}
```

### Prueba 2: Registrar usuario
```bash
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "password123"
  }'
```

Deberías recibir un token JWT.

### Prueba 3: Login
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123"
  }'
```

### Prueba 4: Ruta protegida
```bash
curl -X GET http://localhost:5000/protected \
  -H "x-access-token: TU_TOKEN_AQUI"
```

## 4. Conectar Frontend

Tu frontend React ya debería funcionar sin cambios. Solo asegúrate de que:

1. El frontend está corriendo en `http://localhost:5173`
2. El backend está corriendo en `http://localhost:5000`
3. Socket.IO está configurado para conectar a `http://localhost:5000`

En tu código React:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connected', (data) => {
  console.log('Conectado al servidor:', data.message);
});
```

## 5. Troubleshooting

### Error: "Cannot find module 'express'"
```bash
npm install
```

### Error: "EADDRINUSE: address already in use :::5000"
El puerto 5000 ya está en uso. Cambia el puerto en `.env`:
```env
PORT=5001
```

### Error: "connect ECONNREFUSED 127.0.0.1:27017"
MongoDB no está corriendo. Opciones:

**Opción 1: Instalar MongoDB localmente**
- Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
- Mac: `brew install mongodb-community`
- Linux: Sigue la documentación oficial

**Opción 2: Usar MongoDB Atlas (nube)**
1. Ir a https://www.mongodb.com/cloud/atlas
2. Crear cuenta gratuita
3. Crear cluster
4. Copiar connection string
5. Actualizar `MONGODB_URI` en `.env`

### Error: "Token is invalid"
Verifica que:
1. El token se envía en el header `x-access-token`
2. El token no ha expirado (expira en 1 día)
3. El `JWT_SECRET` en `.env` es correcto

### Socket.IO no conecta
1. Verifica que el servidor está corriendo
2. Abre la consola del navegador (F12)
3. Busca errores de CORS
4. Verifica que `FRONTEND_URL` en `.env` es correcto

## 6. Próximos Pasos

1. **Probar el juego completo**: Crea un lobby, invita a otro jugador, inicia el juego
2. **Revisar logs**: Abre la consola del servidor para ver qué está pasando
3. **Leer documentación**: Revisa `README.md` para más detalles
4. **Revisar compatibilidad**: Revisa `COMPATIBILITY.md` para entender los cambios

## 7. Comandos Útiles

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo (con auto-reload)
npm run dev

# Ejecutar en producción
npm start

# Ver logs en tiempo real
npm run dev

# Detener servidor
Ctrl + C
```

## 8. Estructura de Carpetas

```
server/
├── src/
│   ├── index.js                 # Punto de entrada
│   ├── config/
│   │   └── database.js          # Conexión a MongoDB
│   ├── models/
│   │   └── User.js              # Modelo de usuario
│   ├── routes/
│   │   └── auth.js              # Rutas de autenticación
│   ├── middleware/
│   │   └── auth.js              # Middleware JWT
│   ├── services/
│   │   └── aiService.js         # Generación de preguntas
│   └── sockets/
│       └── socketHandler.js     # Eventos Socket.IO
├── .env                         # Variables de entorno
├── .env.example                 # Ejemplo de .env
├── package.json                 # Dependencias
├── README.md                    # Documentación completa
├── COMPATIBILITY.md             # Notas de compatibilidad
└── QUICKSTART.md               # Este archivo
```

## 9. Recursos Útiles

- **Node.js**: https://nodejs.org/
- **Express**: https://expressjs.com/
- **Socket.IO**: https://socket.io/
- **MongoDB**: https://www.mongodb.com/
- **Mongoose**: https://mongoosejs.com/
- **JWT**: https://jwt.io/

## 10. Soporte

Si tienes problemas:

1. Revisa los logs del servidor (consola)
2. Revisa los logs del navegador (F12 → Console)
3. Verifica que todas las dependencias están instaladas
4. Verifica que MongoDB está corriendo
5. Verifica que las variables de entorno son correctas

¡Listo! Tu backend Node.js debería estar funcionando. 🚀
