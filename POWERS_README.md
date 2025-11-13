# 🎮 Sistema de Poderes - Documentación

## Descripción General

El sistema de poderes permite a los jugadores mejorar sus opciones de respuesta durante el juego de trivia. Cada pregunta ofrece **3 tipos de poderes diferentes**, cada uno con un costo de puntos específico.

## 📋 Tipos de Poderes

### 1. **50/50** 🎯
- **Costo:** 100 puntos
- **Descripción:** Elimina 2 respuestas incorrectas
- **Efecto:** Reduce las opciones de respuesta a solo 2 (1 correcta y 1 incorrecta)
- **Estrategia:** Útil cuando dudas mucho. Ideal en preguntas difíciles
- **Riesgo:** Medio - Los puntos invertidos se pierden aunque aciertes

### 2. **Doble Puntos** ⭐
- **Costo:** 300 puntos
- **Descripción:** Duplica los puntos de esta pregunta
- **Efecto:** Si aciertas la respuesta, ganas el doble de puntos
- **Estrategia:** Úsalo cuando estés seguro de tu respuesta
- **Riesgo:** Alto - Pierdes puntos invertidos si fallas, pero ganas mucho si aciertas
- **Nota:** Ideal en preguntas fáciles o de tu tema favorito

### 3. **Tiempo Extra** ⏱️
- **Costo:** 50 puntos
- **Descripción:** Añade 10 segundos más para responder
- **Efecto:** Amplía el temporizador de la pregunta actual
- **Estrategia:** Úsalo cuando necesites más tiempo para pensar
- **Riesgo:** Bajo - El más económico del sistema
- **Nota:** Se puede usar cuando hay poco tiempo

## 🎯 Mecánica de Funcionamiento

### Flujo de Uso de Poderes

1. **Generación**: Cada nueva pregunta genera 3 poderes automáticamente
2. **Selección**: El jugador puede ver los poderes disponibles en el panel
3. **Validación**: Se verifica:
   - Si el jugador tiene suficientes puntos
   - Si el poder ya fue usado en esta pregunta
   - Si el jugador no ha respondido aún
4. **Aplicación**: Se deduce el costo de puntos y se aplica el efecto
5. **Límite**: Solo se puede usar cada poder **una vez por pregunta**

### Restricciones

- ❌ No se puede usar un poder si ya fue usado en la pregunta actual
- ❌ No se puede usar un poder si no tienes suficientes puntos
- ❌ No se puede usar un poder después de responder la pregunta
- ❌ Los puntos deducidos son permanentes (aunque falles la pregunta)

## 💎 Sistema de Puntos

### Cálculo de Puntos por Pregunta

```
Puntos Base = Según dificultad y rapidez de respuesta
             - Fácil: hasta 50 pts
             - Media: hasta 150 pts
             - Difícil: hasta 500 pts

Con Doble Puntos: Puntos Base × 2
```

### Gastos de Poderes

| Poder | Costo | Coste % | Recomendado |
|-------|-------|---------|-------------|
| 50/50 | 100 pts | 0-20% | Cuando dudas |
| Doble Puntos | 300 pts | 0-30% | Cuando estás seguro |
| Tiempo Extra | 50 pts | 0-5% | Cuando queda poco tiempo |

## 📊 Estrategias Recomendadas

### Estrategia Conservadora
- Usa **Tiempo Extra** liberalmente (es el más barato)
- Guarda **50/50** para preguntas muy difíciles
- Raramente uses **Doble Puntos** a menos que estés 100% seguro

### Estrategia Agresiva
- Usa **Doble Puntos** en preguntas fáciles donde confías
- Usa **50/50** en preguntas donde estés 70% seguro
- Usa **Tiempo Extra** estratégicamente al final

### Estrategia Balanceada
- Usa **Tiempo Extra** cuando quedan menos de 5 segundos
- Usa **50/50** cuando estés entre 50-70% seguro
- Usa **Doble Puntos** cuando estés 80% o más seguro

## 🔧 Implementación

### Backend (Python - `powers.py`)

**Clases principales:**
- `PowerType`: Enum con los tipos de poderes
- `PowerCost`: Enum con los costes
- `Power`: Representa un poder individual
- `PowersManager`: Gestor centralizado de poderes por pregunta

**Métodos clave:**
```python
manager = PowersManager()
manager.generate_question_powers()  # Crea 3 poderes
manager.use_power(power_type, current_points)  # Usa un poder
manager.can_use_power(power_type, current_points)  # Valida disponibilidad
```

### Frontend (React - `powersManager.js` y `PowersPanel.jsx`)

**Utilidades:**
- `PowersManager`: Clase para gestionar estado de poderes
- `POWERS_CONFIG`: Configuración y estilos de cada poder
- `PowerUtils`: Funciones auxiliares

**Componente:**
- `PowersPanel.jsx`: Componente React que muestra los poderes
- `PowersPanel.css`: Estilos responsivos

## 📱 Interfaz de Usuario

### Panel de Poderes
- Ubicación: Parte superior del área de juego
- Contenido: Muestra los 3 poderes disponibles
- Información:
  - Nombre y emoji del poder
  - Descripción breve
  - Costo en puntos
  - Estado (disponible/usado/insuficientes puntos)

### Estados Visuales

**Disponible (Activo):**
- Borde dorado
- Efecto de hover
- Cursor puntero

**Usado:**
- Opacidad reducida
- Borde verde (✓)
- Cursor deshabilitado

**Insuficientes Puntos:**
- Opacidad media
- Muestra cuántos puntos faltan
- Cursor deshabilitado

**Tooltip al Pasar el Mouse:**
- Muestra efecto completo
- Indica si está disponible o no

## 🎲 Integración con Socket.IO

### Eventos Que Envía el Cliente

```javascript
socket.emit('use_power', {
  power_type: 'fifty_fifty',
  current_points: 2500
});
```

### Eventos Que Recibe del Servidor

```javascript
socket.on('power_used', (data) => {
  // {
  //   success: true,
  //   power_type: 'fifty_fifty',
  //   cost: 100,
  //   new_points: 2400,
  //   effect: { type: 'fifty_fifty', message: '...', remaining_options: 2 }
  // }
});
```

## 🎨 Paleta de Colores Poderes

- **50/50**: Azul (#3b82f6)
- **Doble Puntos**: Ámbar (#f59e0b)
- **Tiempo Extra**: Verde (#10b981)

## 📈 Ejemplos de Uso

### Ejemplo 1: Usar 50/50
```javascript
const powerResult = powersManager.usePower('fifty_fifty');
// Devuelve:
// {
//   success: true,
//   newPoints: 2400,
//   costDeducted: 100
// }
```

### Ejemplo 2: Verificar Disponibilidad
```javascript
const status = powersManager.getPowerStatus('double_points');
// Devuelve:
// {
//   type: 'double_points',
//   cost: 300,
//   isUsed: false,
//   canUse: true,
//   config: { ... }
// }
```

### Ejemplo 3: Usar Tiempo Extra
```javascript
if (timeLeft < 5) {
  socket.emit('use_power', { power_type: 'time_boost' });
}
```

## 🚀 Próximas Mejoras

- [ ] Poderes especiales por logros
- [ ] Poderes mejorados a través de niveles
- [ ] Sistema de combo (usar 2 poderes en la misma pregunta)
- [ ] Poderes de ayuda del público
- [ ] Almacenamiento de estadísticas de poder
- [ ] Achievements por uso eficiente de poderes

## ❓ FAQ

**P: ¿Puedo usar dos poderes en la misma pregunta?**
A: No, cada pregunta permite usar máximo un poder de cada tipo (3 máximo).

**P: ¿Se recuperan los puntos si fallo la pregunta?**
A: No, los puntos se deducen al usar el poder, no depende del resultado.

**P: ¿Los poderes se heredan a la siguiente pregunta?**
A: No, cada pregunta tiene 3 poderes nuevos. Los usados se pierden.

**P: ¿Cuál es el mejor poder?**
A: Depende de tu estrategia. 50/50 es más seguro, Doble Puntos más arriesgado.

**P: ¿Hay límite de poderes por partida?**
A: No, tienes acceso a 3 poderes por cada pregunta.

---

**Última actualización:** Noviembre 2025
**Versión:** 1.0
