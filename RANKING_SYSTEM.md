# Sistema de Ranking Global - Game-On

## 📊 Descripción General

Se ha implementado un sistema completo de ranking global que registra las partidas ganadas de los usuarios autenticados. El sistema incluye:

- ✅ Registro automático de victorias en la base de datos
- ✅ Página de ranking global con tabla ordenada
- ✅ Estadísticas en el perfil del usuario
- ✅ Animaciones GSAP para mejor UX
- ✅ Iconos de react-icons (medallas, trofeos)
- ✅ Diseño responsive y tema claro/oscuro

---

## 🔧 Cambios Realizados

### Backend (Flask)

#### 1. `backend/auth.py`
```python
# Campo agregado al crear usuarios
'games_won': 0

# Nuevo endpoint
GET /obtenerUsuarios
# Retorna: { usuarios: [ { rank, name, games_won }, ... ] }

# Nueva función
incrementar_partidas_ganadas(public_id)
# Incrementa el contador de partidas ganadas
```

#### 2. `backend/main.py`
```python
# Ruta registrada
app.add_url_rule('/obtenerUsuarios', 'obtener_usuarios', obtener_usuarios, methods=['GET'])
```

#### 3. `backend/sockets.py`
```python
# En handle_create_lobby() y handle_join_lobby()
'public_id': public_id  # Agregado a datos del jugador

# En end_game()
# Registra victoria si el ganador tiene public_id
if winner.get('public_id'):
    incrementar_partidas_ganadas(winner['public_id'])
```

### Frontend (React)

#### 1. Nuevo Componente: `RankingGlobal.jsx`
**Ubicación:** `frontend/src/pages/ranking/RankingGlobal.jsx`

Características:
- Tabla de ranking con posiciones
- Iconos de medallas (Oro, Plata, Bronce)
- Animaciones GSAP:
  - Entrada de filas con efecto stagger
  - Hover effect con scale
- Estados: loading, error, empty
- Fetch automático desde `/obtenerUsuarios`

```jsx
// Uso
import RankingGlobal from './pages/ranking/RankingGlobal';
<Route path="/ranking" element={<RankingGlobal />} />
```

#### 2. Actualizado: `Profile.jsx`
- Nueva sección "Estadísticas"
- Muestra partidas ganadas
- Iconos: FaTrophy, FaGamepad
- Fetch automático de datos

#### 3. Actualizado: `App.jsx`
```jsx
import RankingGlobal from './pages/ranking/RankingGlobal';

// Ruta agregada
<Route path="/ranking" element={<RankingGlobal />} />
```

#### 4. Actualizado: `Navbar.jsx`
- Botón "Ranking" con icono FaTrophy
- Navegación a `/ranking`
- Estilos personalizados

#### 5. Actualizado: `Home.jsx`
```jsx
// Pasar public_id al crear/unirse a lobby
onCreateLobby({ 
  player_name: playerName, 
  max_players: maxPlayers,
  public_id: user?.public_id || null
});
```

---

## 🚀 Flujo de Funcionamiento

```
1. Usuario se registra
   ↓
2. Se crea con games_won: 0 en BD
   ↓
3. Usuario crea/se une a lobby
   ↓
4. Se envía public_id al backend
   ↓
5. Juego termina
   ↓
6. Backend detecta ganador
   ↓
7. Si tiene public_id → incrementa games_won
   ↓
8. Usuario ve perfil/ranking actualizado
```

---

## 📱 Cómo Usar

### Para Jugadores Autenticados

1. **Registrarse/Iniciar sesión**
   - Crear cuenta con email y contraseña
   - El sistema crea automáticamente `games_won: 0`

2. **Jugar partidas**
   - Crear o unirse a un lobby
   - El `public_id` se envía automáticamente
   - Ganar partidas para acumular victorias

3. **Ver Estadísticas**
   - Ir a "Perfil" → Ver "Partidas Ganadas"
   - Ir a "Ranking" → Ver posición global

### Para Jugadores Anónimos

- Pueden jugar pero **no aparecen en ranking**
- Las victorias no se registran
- Pueden ver el ranking pero no participan

---

## 🎨 Componentes Visuales

### RankingGlobal
- **Tabla:** Posición | Jugador | Partidas Ganadas
- **Medallas:** 🥇 Oro (1º) | 🥈 Plata (2º) | 🥉 Bronce (3º)
- **Animaciones:** Entrada stagger + hover scale
- **Responsive:** Funciona en móvil y desktop

### Profile - Estadísticas
- **Tarjeta 1:** 🏆 Partidas Ganadas (número)
- **Tarjeta 2:** 🎮 Jugador Registrado (✓)
- **Hover:** Elevación y cambio de color

---

## 🔌 Endpoints API

### GET `/obtenerUsuarios`
**Retorna:** Lista de usuarios ordenados por partidas ganadas

```json
{
  "usuarios": [
    {
      "rank": 1,
      "name": "Juan",
      "games_won": 5
    },
    {
      "rank": 2,
      "name": "María",
      "games_won": 3
    }
  ]
}
```

---

## 📦 Dependencias Requeridas

### Frontend
```bash
npm install gsap react-icons
```

### Backend
- Flask (ya instalado)
- PyMongo (ya instalado)

---

## ⚙️ Configuración

No requiere configuración adicional. El sistema funciona automáticamente:

1. Los usuarios se crean con `games_won: 0`
2. Las victorias se registran automáticamente
3. El ranking se actualiza en tiempo real

---

## 🐛 Troubleshooting

### El ranking no muestra usuarios
- Verificar que los usuarios estén registrados
- Verificar que hayan jugado partidas
- Verificar que el endpoint `/obtenerUsuarios` responda

### Las victorias no se registran
- Verificar que el usuario esté autenticado (tenga `public_id`)
- Verificar que el juego termine correctamente
- Revisar logs del backend

### Las animaciones no funcionan
- Verificar que GSAP esté instalado: `npm install gsap`
- Verificar que no haya errores en consola

---

## 📝 Notas Importantes

- ✅ Las victorias se registran **solo si el usuario está autenticado**
- ✅ Los usuarios anónimos pueden jugar pero no aparecen en ranking
- ✅ El ranking se actualiza en tiempo real
- ✅ Compatible con tema claro/oscuro
- ✅ Diseño responsive para móvil y desktop
- ✅ Animaciones suaves sin afectar performance

---

## 🎯 Próximas Mejoras (Opcionales)

- [ ] Filtrar ranking por período (semanal, mensual)
- [ ] Agregar estadísticas adicionales (promedio de puntos, racha de victorias)
- [ ] Badges/Logros por hitos
- [ ] Comparación con otros jugadores
- [ ] Gráficos de progreso

---

**Versión:** 1.0  
**Fecha:** 2024  
**Estado:** ✅ Completado
