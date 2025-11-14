# Guía de Pruebas - Sistema de Ranking Global

## ✅ Checklist de Verificación

### 1. Backend - Verificación de Cambios

#### Archivo: `backend/auth.py`
- [ ] Campo `games_won: 0` agregado al crear usuarios (línea ~57)
- [ ] Función `obtener_usuarios()` existe (línea ~103)
- [ ] Función `incrementar_partidas_ganadas()` existe (línea ~128)

#### Archivo: `backend/main.py`
- [ ] Ruta `/obtenerUsuarios` registrada (línea ~52)
- [ ] Importa `obtener_usuarios` de auth.py (línea ~44)

#### Archivo: `backend/sockets.py`
- [ ] `public_id` agregado en `handle_create_lobby()` (línea ~95)
- [ ] `public_id` agregado en `handle_join_lobby()` (línea ~130)
- [ ] Victoria registrada en `end_game()` (línea ~496-502)

---

### 2. Frontend - Verificación de Cambios

#### Archivo: `frontend/src/pages/ranking/RankingGlobal.jsx`
- [ ] Archivo existe y no está vacío
- [ ] Importa `gsap` y `react-icons`
- [ ] Componente renderiza tabla de ranking
- [ ] Animaciones GSAP implementadas

#### Archivo: `frontend/src/pages/Profile.jsx`
- [ ] Sección "Estadísticas" agregada
- [ ] Muestra "Partidas Ganadas"
- [ ] Fetch desde `/obtenerUsuarios` implementado

#### Archivo: `frontend/src/App.jsx`
- [ ] Importa `RankingGlobal` (línea ~14)
- [ ] Ruta `/ranking` agregada (línea ~243-246)

#### Archivo: `frontend/src/components/Navbar.jsx`
- [ ] Botón "Ranking" agregado
- [ ] Icono FaTrophy importado
- [ ] Navegación a `/ranking` funciona

#### Archivo: `frontend/src/pages/Home.jsx`
- [ ] `public_id` pasa en `handleCreateLobby()`
- [ ] `public_id` pasa en `handleJoinLobby()`
- [ ] `public_id` pasa en `handleQuickJoin()`

---

## 🧪 Pruebas Funcionales

### Prueba 1: Crear Usuario y Verificar games_won

```bash
# 1. Registrar usuario nuevo
POST http://localhost:5000/register
{
  "name": "TestUser",
  "email": "test@example.com",
  "password": "password123"
}

# 2. Verificar en MongoDB
db.users.findOne({ email: "test@example.com" })
# Debe mostrar: games_won: 0
```

✅ **Esperado:** Usuario creado con `games_won: 0`

---

### Prueba 2: Obtener Ranking

```bash
# 1. Llamar endpoint
GET http://localhost:5000/obtenerUsuarios

# 2. Verificar respuesta
{
  "usuarios": [
    { "rank": 1, "name": "TestUser", "games_won": 0 },
    ...
  ]
}
```

✅ **Esperado:** Lista de usuarios ordenados por games_won descendente

---

### Prueba 3: Jugar Partida y Registrar Victoria

```
1. Iniciar sesión con usuario registrado
2. Crear lobby (public_id se envía automáticamente)
3. Agregar otro jugador
4. Jugar partida completa
5. Ganar partida
6. Verificar en BD que games_won aumentó
```

✅ **Esperado:** `games_won` incrementado en 1

---

### Prueba 4: Ver Ranking en Frontend

```
1. Abrir http://localhost:5173/ranking
2. Verificar que se carga tabla
3. Verificar que usuarios aparecen ordenados
4. Verificar animaciones GSAP
5. Hacer hover en filas
```

✅ **Esperado:** 
- Tabla carga correctamente
- Animaciones funcionan
- Usuarios ordenados por victorias

---

### Prueba 5: Ver Estadísticas en Perfil

```
1. Iniciar sesión
2. Ir a Perfil
3. Ver sección "Estadísticas"
4. Verificar "Partidas Ganadas"
```

✅ **Esperado:** Muestra número correcto de partidas ganadas

---

### Prueba 6: Usuario Anónimo No Aparece en Ranking

```
1. Jugar sin registrarse
2. Ganar partida
3. Ir a ranking
4. Verificar que no aparece
```

✅ **Esperado:** Usuario anónimo no aparece en ranking

---

## 🔍 Verificación en Consola del Navegador

### Abrir DevTools (F12) y verificar:

```javascript
// 1. Verificar que se conecta al servidor
// En Console debe aparecer: "Conectado al servidor"

// 2. Verificar que carga ranking
fetch('http://localhost:5000/obtenerUsuarios')
  .then(r => r.json())
  .then(d => console.log(d))

// 3. Verificar que GSAP está disponible
console.log(gsap)  // Debe mostrar objeto GSAP

// 4. Verificar que react-icons está disponible
// En Network tab, verificar que los iconos cargan
```

---

## 📊 Verificación en MongoDB

```javascript
// 1. Ver todos los usuarios con games_won
db.users.find({}, { name: 1, games_won: 1 })

// 2. Ver usuario específico
db.users.findOne({ name: "TestUser" })

// 3. Ver ranking ordenado
db.users.find({}, { name: 1, games_won: 1 }).sort({ games_won: -1 })
```

---

## 🐛 Debugging

### Si el ranking no muestra usuarios:

1. **Verificar endpoint:**
   ```bash
   curl http://localhost:5000/obtenerUsuarios
   ```

2. **Verificar MongoDB:**
   ```javascript
   db.users.count()  // Debe ser > 0
   ```

3. **Verificar logs del backend:**
   ```bash
   # Buscar errores en terminal del servidor
   ```

### Si las victorias no se registran:

1. **Verificar que el usuario está autenticado:**
   - Verificar que `public_id` existe en localStorage
   - Verificar que se envía en datos del lobby

2. **Verificar logs en sockets.py:**
   ```python
   print(f"Victoria registrada para usuario: {winner['name']}")
   ```

3. **Verificar en MongoDB:**
   ```javascript
   db.users.findOne({ name: "TestUser" })
   // games_won debe incrementar después de cada victoria
   ```

### Si las animaciones no funcionan:

1. **Verificar que GSAP está instalado:**
   ```bash
   npm list gsap
   ```

2. **Verificar en consola:**
   ```javascript
   console.log(gsap)  // Debe mostrar objeto
   ```

3. **Verificar que no hay errores:**
   - Abrir DevTools → Console
   - Buscar errores rojos

---

## 📋 Casos de Prueba Adicionales

### Caso 1: Múltiples Victorias
```
1. Ganar 5 partidas con mismo usuario
2. Verificar que games_won = 5
3. Verificar que aparece en ranking
```

### Caso 2: Múltiples Usuarios
```
1. Crear 3 usuarios
2. Cada uno gana diferente cantidad de partidas
3. Verificar que ranking está ordenado correctamente
```

### Caso 3: Tema Claro/Oscuro
```
1. Ir a ranking
2. Cambiar tema (botón en navbar)
3. Verificar que ranking se ve bien en ambos temas
```

### Caso 4: Responsive
```
1. Ir a ranking
2. Redimensionar ventana
3. Verificar que tabla se adapta
4. Probar en móvil
```

---

## ✅ Checklist Final

- [ ] Backend compila sin errores
- [ ] Frontend compila sin errores
- [ ] Endpoint `/obtenerUsuarios` responde correctamente
- [ ] Usuarios se crean con `games_won: 0`
- [ ] Victorias se registran correctamente
- [ ] Ranking muestra usuarios ordenados
- [ ] Perfil muestra estadísticas correctas
- [ ] Animaciones GSAP funcionan
- [ ] Navbar tiene botón de ranking
- [ ] Usuarios anónimos no aparecen en ranking
- [ ] Tema claro/oscuro funciona
- [ ] Diseño responsive en móvil

---

## 🚀 Próximos Pasos

1. Ejecutar backend:
   ```bash
   cd backend
   python main.py
   ```

2. Ejecutar frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Abrir en navegador:
   ```
   http://localhost:5173
   ```

4. Seguir pruebas de la lista anterior

---

**Versión:** 1.0  
**Última actualización:** 2024
