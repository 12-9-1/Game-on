"""
Sistema de Poderes para el Juego de Trivia
Cada pregunta ofrece 3 tipos de poderes con diferente coste de puntos
"""

from enum import Enum
from typing import Dict, List, Tuple

class PowerType(Enum):
    """Tipos de poderes disponibles"""
    FIFTY_FIFTY = "fifty_fifty"           # Elimina 2 respuestas incorrectas
    DOUBLE_POINTS = "double_points"       # Duplica puntos si acierta
    TIME_BOOST = "time_boost"             # Añade 10 segundos más


class PowerCost(Enum):
    """Costes de cada poder en puntos"""
    FIFTY_FIFTY = 100          # Costo bajo - elimina 2 opciones
    DOUBLE_POINTS = 300        # Costo medio - duplica puntos
    TIME_BOOST = 50            # Costo muy bajo - más tiempo


class Power:
    """Clase que representa un poder individual"""
    
    def __init__(self, power_type: PowerType, cost: int, description: str, effect: str):
        self.power_type = power_type
        self.cost = cost
        self.description = description
        self.effect = effect
        self.is_used = False
    
    def to_dict(self):
        """Convierte el poder a diccionario para enviar al cliente"""
        return {
            "power_type": self.power_type.value,
            "cost": self.cost,
            "description": self.description,
            "effect": self.effect,
            "is_used": self.is_used
        }


class PowersManager:
    """Gestor central de poderes para cada pregunta"""
    
    # Definiciones de poderes disponibles
    POWERS_CONFIG = {
        PowerType.FIFTY_FIFTY: {
            "cost": PowerCost.FIFTY_FIFTY.value,
            "name": "50/50",
            "description": "Elimina 2 respuestas incorrectas",
            "effect": "Reduce las opciones a solo 2 (1 correcta y 1 incorrecta)",
            "emoji": "🎯"
        },
        PowerType.DOUBLE_POINTS: {
            "cost": PowerCost.DOUBLE_POINTS.value,
            "name": "Doble Puntos",
            "description": "Duplica los puntos de esta pregunta",
            "effect": "Si aciertas, ganas el doble de puntos",
            "emoji": "⭐"
        },
        PowerType.TIME_BOOST: {
            "cost": PowerCost.TIME_BOOST.value,
            "name": "Tiempo Extra",
            "description": "Añade 10 segundos más para responder",
            "effect": "Amplía el temporizador de la pregunta",
            "emoji": "⏱️"
        }
    }

    def __init__(self):
        """Inicializa el gestor de poderes"""
        self.available_powers: List[Power] = []
        self.used_powers: List[Power] = []
        # Tipos de poder usados en la ronda actual (solo 1 uso por poder por ronda)
        self.used_power_types_this_round = set()
        self.player_points = 0
        # Multiplicador aplicado cuando se paga con puntos (sobrecargo)
        self.points_surcharge_multiplier = 1.5

    def generate_question_powers(self) -> List[Dict]:
        """
        Genera 3 poderes para una nueva pregunta
        
        Returns:
            List[Dict]: Lista de 3 poderes disponibles
        """
        self.available_powers = []
        self.used_powers = []
        
        for power_type, config in self.POWERS_CONFIG.items():
            power = Power(
                power_type=power_type,
                cost=config["cost"],
                description=config["description"],
                effect=config["effect"]
            )
            self.available_powers.append(power)
        
        return [p.to_dict() for p in self.available_powers]

    def can_use_power(self, power_type: str, current_points: int) -> Tuple[bool, str]:
        """
        Verifica si un jugador puede usar un poder
        
        Args:
            power_type: Tipo de poder a usar
            current_points: Puntos actuales del jugador
            
        Returns:
            Tuple[bool, str]: (Puede usar, Mensaje)
        """
        # Convertir string a PowerType
        try:
            p_type = PowerType(power_type)
        except ValueError:
            return False, "Poder no válido"
        
        # Buscar el poder en disponibles
        power = next((p for p in self.available_powers if p.power_type == p_type), None)
        
        if not power:
            return False, "Poder no disponible"
        
        # Calcular coste real si se paga con puntos (se aplicará sobrecargo más adelante en use_power)
        if current_points < power.cost:
            return False, f"No tienes suficientes puntos. Necesitas {power.cost}, tienes {current_points}"
        
        return True, "Poder disponible"

    def use_power(self, power_type: str, current_points: int) -> Tuple[bool, Dict]:
        """
        Usa un poder y devuelve el efecto
        
        Args:
            power_type: Tipo de poder a usar
            current_points: Puntos actuales del jugador
            
        Returns:
            Tuple[bool, Dict]: (Éxito, Datos del efecto)
        """
        can_use, message = self.can_use_power(power_type, current_points)
        
        if not can_use:
            return False, {"error": message}
        
        try:
            p_type = PowerType(power_type)
        except ValueError:
            return False, {"error": "Poder no válido"}

        # Verificar que el poder no haya sido usado ya en esta ronda (uso global por ronda)
        if p_type.value in self.used_power_types_this_round:
            return False, {"error": "Este poder ya fue usado en la ronda"}

        # Buscar el poder
        power = next((p for p in self.available_powers if p.power_type == p_type), None)
        if not power:
            return False, {"error": "Poder no disponible"}

        # Aplicar sobrecargo si se paga con puntos (por defecto asumimos pago con puntos)
        # Redondeamos al entero más cercano
        surcharge_cost = int(round(power.cost * self.points_surcharge_multiplier))

        if current_points < surcharge_cost:
            return False, {"error": f"No tienes suficientes puntos. Necesitas {surcharge_cost}, tienes {current_points}"}

        # Marcar como usado para la ronda
        self.used_power_types_this_round.add(p_type.value)

        # Aplicar efecto del poder
        effect_data = self._apply_power_effect(p_type, current_points)

        return True, {
            "success": True,
            "power_type": power_type,
            # Devolvemos el coste real que se ha cobrado (con sobrecargo)
            "cost": surcharge_cost,
            "new_points": current_points - surcharge_cost,
            "effect": effect_data
        }

    def _apply_power_effect(self, power_type: PowerType, current_points: int) -> Dict:
        """
        Aplica el efecto específico de cada poder
        
        Args:
            power_type: Tipo de poder
            current_points: Puntos actuales
            
        Returns:
            Dict: Datos del efecto aplicado
        """
        if power_type == PowerType.FIFTY_FIFTY:
            return {
                "type": "fifty_fifty",
                "message": "Se han eliminado 2 opciones incorrectas",
                "remaining_options": 2
            }
        
        elif power_type == PowerType.DOUBLE_POINTS:
            return {
                "type": "double_points",
                "message": "¡Ganarás el doble de puntos en esta pregunta!",
                "multiplier": 2
            }
        
        elif power_type == PowerType.TIME_BOOST:
            return {
                "type": "time_boost",
                "message": "Se añadieron 10 segundos al temporizador",
                "added_time": 10
            }

    def get_available_powers(self) -> List[Dict]:
        """
        Obtiene todos los poderes disponibles aún no usados
        
        Returns:
            List[Dict]: Lista de poderes disponibles
        """
        return [p.to_dict() for p in self.available_powers if not p.is_used]

    def get_question_powers_info(self) -> List[Dict]:
        """
        Obtiene información formateada de los poderes para mostrar al cliente
        
        Returns:
            List[Dict]: Información formateada de cada poder
        """
        powers_info = []
        
        for power_type, config in self.POWERS_CONFIG.items():
            is_used = any(p.power_type == power_type for p in self.used_powers)
            powers_info.append({
                "power_type": power_type.value,
                "name": config["name"],
                "emoji": config["emoji"],
                "cost": config["cost"],
                "description": config["description"],
                "effect": config["effect"],
                "is_used": is_used
            })
        
        return powers_info

    def reset_for_new_question(self):
        """Reinicia el gestor para una nueva pregunta"""
        self.available_powers = []
        self.used_powers = []

    def reset_for_new_round(self):
        """Resetea los estados que deberían limpiarse al comenzar una nueva ronda (uso global por ronda)"""
        self.used_power_types_this_round = set()
        # También reiniciamos la lista de poderes disponibles
        self.available_powers = []
        self.used_powers = []


# Función auxiliar para testing
def create_powers_for_player() -> PowersManager:
    """
    Crea una instancia de PowersManager con poderes generados
    
    Returns:
        PowersManager: Gestor con poderes listos para usar
    """
    manager = PowersManager()
    manager.generate_question_powers()
    return manager
