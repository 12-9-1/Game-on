/**
 * Gestor de Poderes para el Frontend
 * Maneja la visualización y uso de poderes en cada pregunta
 */

// Tipos de poderes disponibles
export const POWER_TYPES = {
  FIFTY_FIFTY: "fifty_fifty",
  DOUBLE_POINTS: "double_points",
  TIME_BOOST: "time_boost",
};

// Configuración de poderes para mostrar
export const POWERS_CONFIG = {
  fifty_fifty: {
    name: "50/50",
    emoji: "🎯",
    color: "#3b82f6",
    cost: 700,
    description: "Elimina 2 respuestas incorrectas",
    effect: "Reduce las opciones a solo 2 (1 correcta y 1 incorrecta)",
    className: "power-fifty-fifty",
  },
  double_points: {
    name: "Doble Puntos",
    emoji: "⭐",
    color: "#f59e0b",
    cost: 900,
    description: "Duplica los puntos de esta pregunta",
    effect: "Si aciertas, ganas el doble de puntos",
    className: "power-double-points",
  },
  time_boost: {
    name: "Tiempo Extra",
    emoji: "⏱️",
    color: "#10b981",
    cost: 400,
    description: "Añade 10 segundos más para responder",
    effect: "Amplía el temporizador de la pregunta",
    className: "power-time-boost",
  },
};

/**
 * Clase para gestionar poderes del jugador
 */
export class PowersManager {
  constructor(playerPoints = 0) {
    this.playerPoints = playerPoints;
    this.availablePowers = [];
    this.usedPowers = [];
  }

  /**
   * Inicializa los poderes recibidos del servidor
   */
  initializePowers(powersData) {
    this.availablePowers = powersData.map((power) => ({
      ...power,
      config: POWERS_CONFIG[power.power_type],
    }));
  }

  /**
   * Verifica si un poder puede ser usado
   */
  canUsePower(powerType) {
    const power = this.availablePowers.find((p) => p.power_type === powerType);

    if (!power) return { canUse: false, reason: "Poder no disponible" };
    if (power.is_used)
      return { canUse: false, reason: "Ya usado en esta pregunta" };
    if (this.playerPoints < power.cost) {
      return {
        canUse: false,
        reason: `Necesitas ${power.cost} puntos, tienes ${this.playerPoints}`,
      };
    }

    return { canUse: true };
  }

  /**
   * Usa un poder y descuenta los puntos
   */
  usePower(powerType) {
    const check = this.canUsePower(powerType);
    if (!check.canUse) return { success: false, reason: check.reason };

    const power = this.availablePowers.find((p) => p.power_type === powerType);
    power.is_used = true;
    this.usedPowers.push(power);
    this.playerPoints -= power.cost;

    return {
      success: true,
      newPoints: this.playerPoints,
      costDeducted: power.cost,
    };
  }

  /**
   * Obtiene poderes disponibles (no usados)
   */
  getAvailablePowers() {
    return this.availablePowers.filter((p) => !p.is_used);
  }

  /**
   * Obtiene todos los poderes con su estado actual
   */
  getAllPowers() {
    return this.availablePowers;
  }

  /**
   * Reinicia poderes para nueva pregunta
   */
  resetForNewQuestion(newPoints) {
    this.playerPoints = newPoints;
    this.usedPowers = [];
    // Los disponibles se reiniciarán con nuevos datos del servidor
  }

  /**
   * Verifica si hay poderes disponibles por usar
   */
  hasPowersAvailable() {
    return this.availablePowers.some((p) => !p.is_used);
  }

  /**
   * Obtiene el estado de un poder específico
   */
  getPowerStatus(powerType) {
    const power = this.availablePowers.find((p) => p.power_type === powerType);
    if (!power) return null;

    return {
      type: power.power_type,
      cost: power.cost,
      isUsed: power.is_used,
      canUse: this.playerPoints >= power.cost && !power.is_used,
      config: POWERS_CONFIG[power.power_type],
    };
  }
}

/**
 * Utilidades para formatear información de poderes
 */
export const PowerUtils = {
  /**
   * Formatea el coste de un poder para mostrar
   */
  formatCost(cost) {
    return `${cost} pts`;
  },

  /**
   * Obtiene el color del poder basado en su tipo
   */
  getPowerColor(powerType) {
    return POWERS_CONFIG[powerType]?.color || "#6b7280";
  },

  /**
   * Obtiene el emoji del poder
   */
  getPowerEmoji(powerType) {
    return POWERS_CONFIG[powerType]?.emoji || "✨";
  },

  /**
   * Obtiene el nombre del poder
   */
  getPowerName(powerType) {
    return POWERS_CONFIG[powerType]?.name || "Poder Desconocido";
  },

  /**
   * Verifica si el jugador tiene suficientes puntos para un poder
   */
  hasEnoughPoints(playerPoints, powerType) {
    const cost = POWERS_CONFIG[powerType]?.cost || 0;
    return playerPoints >= cost;
  },

  /**
   * Calcula puntos después de usar un poder
   */
  calculatePointsAfterPower(currentPoints, powerType) {
    const cost = POWERS_CONFIG[powerType]?.cost || 0;
    return Math.max(0, currentPoints - cost);
  },

  /**
   * Obtiene los efectos formateados de un poder
   */
  formatPowerEffect(powerType) {
    return POWERS_CONFIG[powerType]?.effect || "Efecto desconocido";
  },
};

export default PowersManager;
