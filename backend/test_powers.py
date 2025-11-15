"""
Tests unitarios para el sistema de poderes
Ejecutar con: python test_powers.py
"""

import sys
import os

# Añadir el directorio backend al path para importar
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from powers import PowerType, PowerCost, Power, PowersManager

# Colores para output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

# Contador de tests
total_tests = 0
passed_tests = 0
failed_tests = 0


def test(description):
    """Decorador para tests"""
    def decorator(func):
        def wrapper():
            global total_tests, passed_tests, failed_tests
            total_tests += 1
            try:
                func()
                print(f"{GREEN}✓ {description}{RESET}")
                passed_tests += 1
            except AssertionError as e:
                print(f"{RED}✗ {description}{RESET}")
                print(f"  Error: {e}")
                failed_tests += 1
            except Exception as e:
                print(f"{RED}✗ {description} (Exception){RESET}")
                print(f"  Error: {e}")
                failed_tests += 1
        return wrapper
    return decorator


@test("Crear un poder correctamente")
def test_power_creation():
    power = Power(
        PowerType.FIFTY_FIFTY,
        100,
        "Test description",
        "Test effect"
    )
    assert power.power_type == PowerType.FIFTY_FIFTY
    assert power.cost == 100
    assert power.is_used == False


@test("Convertir poder a diccionario")
def test_power_to_dict():
    power = Power(
        PowerType.FIFTY_FIFTY,
        100,
        "Test description",
        "Test effect"
    )
    result = power.to_dict()
    
    assert result["power_type"] == "fifty_fifty"
    assert result["cost"] == 100
    assert result["is_used"] == False


@test("Inicializar gestor de poderes")
def test_manager_initialization():
    manager = PowersManager()
    assert len(manager.available_powers) == 0
    assert len(manager.used_powers) == 0


@test("Generar poderes para una pregunta")
def test_generate_question_powers():
    manager = PowersManager()
    powers = manager.generate_question_powers()
    
    # Debe generar 3 poderes
    assert len(powers) == 3
    
    # Verificar que contiene los 3 tipos
    power_types = {p["power_type"] for p in powers}
    expected_types = {"fifty_fifty", "double_points", "time_boost"}
    assert power_types == expected_types


@test("Verificar costes correctos de poderes")
def test_all_powers_have_correct_costs():
    manager = PowersManager()
    manager.generate_question_powers()
    
    for power in manager.available_powers:
        if power.power_type == PowerType.FIFTY_FIFTY:
            assert power.cost == 100
        elif power.power_type == PowerType.DOUBLE_POINTS:
            assert power.cost == 300
        elif power.power_type == PowerType.TIME_BOOST:
            assert power.cost == 50


@test("Verificar disponibilidad de poder con puntos suficientes")
def test_can_use_power_with_sufficient_points():
    manager = PowersManager()
    manager.generate_question_powers()
    
    can_use, message = manager.can_use_power("fifty_fifty", 500)
    assert can_use == True
    assert "disponible" in message.lower()


@test("Rechazar poder sin puntos suficientes")
def test_can_use_power_with_insufficient_points():
    manager = PowersManager()
    manager.generate_question_powers()
    
    can_use, message = manager.can_use_power("fifty_fifty", 50)
    assert can_use == False
    assert "suficientes" in message.lower()


@test("Rechazar tipo de poder inválido")
def test_can_use_invalid_power_type():
    manager = PowersManager()
    manager.generate_question_powers()
    
    can_use, message = manager.can_use_power("invalid_power", 1000)
    assert can_use == False


@test("Usar poder exitosamente")
def test_use_power_successful():
    manager = PowersManager()
    manager.generate_question_powers()
    
    success, result = manager.use_power("fifty_fifty", 500)
    
    assert success == True
    assert result["success"] == True
    assert result["cost"] == 100
    assert result["new_points"] == 400


@test("Rechazar uso de poder sin puntos")
def test_use_power_insufficient_points():
    manager = PowersManager()
    manager.generate_question_powers()
    
    success, result = manager.use_power("fifty_fifty", 50)
    
    assert success == False
    assert "error" in result


@test("No permitir usar mismo poder dos veces en la misma pregunta")
def test_use_power_twice_in_same_question():
    manager = PowersManager()
    manager.generate_question_powers()
    
    # Usar el poder la primera vez
    success1, _ = manager.use_power("fifty_fifty", 500)
    assert success1 == True
    
    # Intentar usarlo de nuevo
    success2, result = manager.use_power("fifty_fifty", 400)
    assert success2 == False
    assert "ya usado" in result["error"].lower()


@test("Aplicar efectos correctamente")
def test_power_effects():
    manager = PowersManager()
    manager.generate_question_powers()
    
    # Test 50/50
    _, result_50_50 = manager.use_power("fifty_fifty", 500)
    assert result_50_50["effect"]["type"] == "fifty_fifty"
    assert result_50_50["effect"]["remaining_options"] == 2
    
    # Reseteamos para siguiente poder
    manager.reset_for_new_question()
    manager.generate_question_powers()
    
    # Test DOUBLE_POINTS
    _, result_double = manager.use_power("double_points", 500)
    assert result_double["effect"]["type"] == "double_points"
    assert result_double["effect"]["multiplier"] == 2
    
    # Reseteamos
    manager.reset_for_new_question()
    manager.generate_question_powers()
    
    # Test TIME_BOOST
    _, result_time = manager.use_power("time_boost", 500)
    assert result_time["effect"]["type"] == "time_boost"
    assert result_time["effect"]["added_time"] == 10


@test("Obtener poderes disponibles")
def test_get_available_powers():
    manager = PowersManager()
    manager.generate_question_powers()
    
    # Usar un poder
    manager.use_power("fifty_fifty", 500)
    
    # Obtener disponibles
    available = manager.get_available_powers()
    
    # Debe haber 2 disponibles (no el que usamos)
    assert len(available) == 2
    
    power_types = {p["power_type"] for p in available}
    assert "fifty_fifty" not in power_types
    assert "double_points" in power_types
    assert "time_boost" in power_types


@test("Obtener información formateada de poderes")
def test_get_question_powers_info():
    manager = PowersManager()
    manager.generate_question_powers()
    
    # Usar un poder
    manager.use_power("fifty_fifty", 500)
    
    info = manager.get_question_powers_info()
    
    assert len(info) == 3
    
    # Verificar que el poder usado está marcado
    fifty_fifty_info = next((p for p in info if p["power_type"] == "fifty_fifty"), None)
    assert fifty_fifty_info is not None
    assert fifty_fifty_info["is_used"] == True
    
    # Verificar que otros no están marcados
    double_points_info = next((p for p in info if p["power_type"] == "double_points"), None)
    assert double_points_info["is_used"] == False


@test("Resetear para nueva pregunta")
def test_reset_for_new_question():
    manager = PowersManager()
    manager.generate_question_powers()
    
    # Usar algunos poderes
    manager.use_power("fifty_fifty", 500)
    manager.use_power("double_points", 400)
    
    # Verificar estado
    assert len(manager.used_powers) == 2
    
    # Reseteamos
    manager.reset_for_new_question()
    
    # Verificar que se limpió
    assert len(manager.available_powers) == 0
    assert len(manager.used_powers) == 0


@test("Verificar que todos los poderes tienen descripciones")
def test_all_powers_have_descriptions():
    manager = PowersManager()
    manager.generate_question_powers()
    
    for power in manager.available_powers:
        assert power.description is not None
        assert len(power.description) > 0
        assert power.effect is not None
        assert len(power.effect) > 0


@test("Verificar valores de enum PowerCost")
def test_power_cost_enum_values():
    assert PowerCost.FIFTY_FIFTY.value == 100
    assert PowerCost.DOUBLE_POINTS.value == 300
    assert PowerCost.TIME_BOOST.value == 50


@test("Verificar valores de enum PowerType")
def test_power_type_enum_values():
    assert PowerType.FIFTY_FIFTY.value == "fifty_fifty"
    assert PowerType.DOUBLE_POINTS.value == "double_points"
    assert PowerType.TIME_BOOST.value == "time_boost"


@test("Flujo completo de una pregunta con poderes")
def test_complete_question_power_flow():
    manager = PowersManager()
    
    # Inicializar poderes para pregunta 1
    powers_q1 = manager.generate_question_powers()
    assert len(powers_q1) == 3
    
    # Verificar todos disponibles
    available = manager.get_available_powers()
    assert len(available) == 3
    
    # Usar 50/50
    success, result = manager.use_power("fifty_fifty", 1000)
    assert success == True
    assert result["new_points"] == 900
    
    # Verificar solo 2 disponibles
    available = manager.get_available_powers()
    assert len(available) == 2
    
    # Nueva pregunta
    manager.reset_for_new_question()
    powers_q2 = manager.generate_question_powers()
    
    # Todos deberían estar disponibles de nuevo
    assert len(powers_q2) == 3
    available = manager.get_available_powers()
    assert len(available) == 3


@test("Secuencia de múltiples preguntas")
def test_multiple_questions_sequence():
    manager = PowersManager()
    player_points = 5000
    
    for question_num in range(5):
        manager.generate_question_powers()
        
        # Usar un poder aleatorio
        if question_num % 2 == 0:
            success, result = manager.use_power("fifty_fifty", player_points)
            if success:
                player_points = result["new_points"]
        else:
            success, result = manager.use_power("time_boost", player_points)
            if success:
                player_points = result["new_points"]
        
        # Reseteamos para próxima pregunta
        manager.reset_for_new_question()
        
        # Verificar que se limpió correctamente
        assert len(manager.available_powers) == 0
        assert len(manager.used_powers) == 0


# Ejecutar todos los tests
class TestPowersManager
    """Tests para la clase PowersManager"""
    
    def test_manager_initialization(self):
        """Test inicialización del gestor"""
        manager = PowersManager()
        assert len(manager.available_powers) == 0
        assert len(manager.used_powers) == 0
    
    def test_generate_question_powers(self):
        """Test generación de poderes para pregunta"""
        manager = PowersManager()
        powers = manager.generate_question_powers()
        
        # Debe generar 3 poderes
        assert len(powers) == 3
        
        # Verificar que contiene los 3 tipos
        power_types = {p["power_type"] for p in powers}
        expected_types = {"fifty_fifty", "double_points", "time_boost"}
        assert power_types == expected_types
    
    def test_all_powers_have_correct_costs(self):
        """Test que los costes son correctos"""
        manager = PowersManager()
        manager.generate_question_powers()
        
        for power in manager.available_powers:
            if power.power_type == PowerType.FIFTY_FIFTY:
                assert power.cost == 100
            elif power.power_type == PowerType.DOUBLE_POINTS:
                assert power.cost == 300
            elif power.power_type == PowerType.TIME_BOOST:
                assert power.cost == 50
    
    def test_can_use_power_with_sufficient_points(self):
        """Test verificación con puntos suficientes"""
        manager = PowersManager()
        manager.generate_question_powers()
        
        can_use, message = manager.can_use_power("fifty_fifty", 500)
        assert can_use == True
        assert "disponible" in message.lower()
    
    def test_can_use_power_with_insufficient_points(self):
        """Test verificación sin puntos suficientes"""
        manager = PowersManager()
        manager.generate_question_powers()
        
        can_use, message = manager.can_use_power("fifty_fifty", 50)
        assert can_use == False
        assert "suficientes" in message.lower()
    
    def test_can_use_invalid_power_type(self):
        """Test con tipo de poder inválido"""
        manager = PowersManager()
        manager.generate_question_powers()
        
        can_use, message = manager.can_use_power("invalid_power", 1000)
        assert can_use == False
    
    def test_use_power_successful(self):
        """Test uso exitoso de poder"""
        manager = PowersManager()
        manager.generate_question_powers()
        
        success, result = manager.use_power("fifty_fifty", 500)
        
        assert success == True
        assert result["success"] == True
        assert result["cost"] == 100
        assert result["new_points"] == 400
    
    def test_use_power_insufficient_points(self):
        """Test intento de usar poder sin puntos"""
        manager = PowersManager()
        manager.generate_question_powers()
        
        success, result = manager.use_power("fifty_fifty", 50)
        
        assert success == False
        assert "error" in result
    
    def test_use_power_twice_in_same_question(self):
        """Test no se puede usar mismo poder dos veces"""
        manager = PowersManager()
        manager.generate_question_powers()
        
        # Usar el poder la primera vez
        success1, _ = manager.use_power("fifty_fifty", 500)
        assert success1 == True
        
        # Intentar usarlo de nuevo
        success2, result = manager.use_power("fifty_fifty", 400)
        assert success2 == False
        assert "ya usado" in result["error"].lower()
    
    def test_power_effects(self):
        """Test que los efectos se aplican correctamente"""
        manager = PowersManager()
        manager.generate_question_powers()
        
        # Test 50/50
        _, result_50_50 = manager.use_power("fifty_fifty", 500)
        assert result_50_50["effect"]["type"] == "fifty_fifty"
        assert result_50_50["effect"]["remaining_options"] == 2
        
        # Reseteamos para siguiente poder
        manager.reset_for_new_question()
        manager.generate_question_powers()
        
        # Test DOUBLE_POINTS
        _, result_double = manager.use_power("double_points", 500)
        assert result_double["effect"]["type"] == "double_points"
        assert result_double["effect"]["multiplier"] == 2
        
        # Reseteamos
        manager.reset_for_new_question()
        manager.generate_question_powers()
        
        # Test TIME_BOOST
        _, result_time = manager.use_power("time_boost", 500)
        assert result_time["effect"]["type"] == "time_boost"
        assert result_time["effect"]["added_time"] == 10
    
    def test_get_available_powers(self):
        """Test obtener poderes disponibles"""
        manager = PowersManager()
        manager.generate_question_powers()
        
        # Usar un poder
        manager.use_power("fifty_fifty", 500)
        
        # Obtener disponibles
        available = manager.get_available_powers()
        
        # Debe haber 2 disponibles (no el que usamos)
        assert len(available) == 2
        
        power_types = {p["power_type"] for p in available}
        assert "fifty_fifty" not in power_types
        assert "double_points" in power_types
        assert "time_boost" in power_types
    
    def test_get_question_powers_info(self):
        """Test información formateada de poderes"""
        manager = PowersManager()
        manager.generate_question_powers()
        
        # Usar un poder
        manager.use_power("fifty_fifty", 500)
        
        info = manager.get_question_powers_info()
        
        assert len(info) == 3
        
        # Verificar que el poder usado está marcado
        fifty_fifty_info = next((p for p in info if p["power_type"] == "fifty_fifty"), None)
        assert fifty_fifty_info is not None
        assert fifty_fifty_info["is_used"] == True
        
        # Verificar que otros no están marcados
        double_points_info = next((p for p in info if p["power_type"] == "double_points"), None)
        assert double_points_info["is_used"] == False
    
    def test_reset_for_new_question(self):
        """Test reseteo para nueva pregunta"""
        manager = PowersManager()
        manager.generate_question_powers()
        
        # Usar algunos poderes
        manager.use_power("fifty_fifty", 500)
        manager.use_power("double_points", 400)
        
        # Verificar estado
        assert len(manager.used_powers) == 2
        
        # Reseteamos
        manager.reset_for_new_question()
        
        # Verificar que se limpió
        assert len(manager.available_powers) == 0
        assert len(manager.used_powers) == 0
    
    def test_all_powers_have_descriptions(self):
        """Test que todos los poderes tienen descripciones"""
        manager = PowersManager()
        manager.generate_question_powers()
        
        for power in manager.available_powers:
            assert power.description is not None
            assert len(power.description) > 0
            assert power.effect is not None
            assert len(power.effect) > 0


class TestPowerCostValues:
    """Tests para verificar costes correctos"""
    
    def test_power_cost_enum_values(self):
        """Test valores del enum PowerCost"""
        assert PowerCost.FIFTY_FIFTY.value == 100
        assert PowerCost.DOUBLE_POINTS.value == 300
        assert PowerCost.TIME_BOOST.value == 50
    
    def test_power_type_enum_values(self):
        """Test valores del enum PowerType"""
        assert PowerType.FIFTY_FIFTY.value == "fifty_fifty"
        assert PowerType.DOUBLE_POINTS.value == "double_points"
        assert PowerType.TIME_BOOST.value == "time_boost"


class TestPowerIntegration:
    """Tests de integración del sistema completo"""
    
    def test_complete_question_power_flow(self):
        """Test flujo completo de una pregunta con poderes"""
        manager = PowersManager()
        
        # Inicializar poderes para pregunta 1
        powers_q1 = manager.generate_question_powers()
        assert len(powers_q1) == 3
        
        # Verificar todos disponibles
        available = manager.get_available_powers()
        assert len(available) == 3
        
        # Usar 50/50
        success, result = manager.use_power("fifty_fifty", 1000)
        assert success == True
        assert result["new_points"] == 900
        
        # Verificar solo 2 disponibles
        available = manager.get_available_powers()
        assert len(available) == 2
        
        # Nueva pregunta
        manager.reset_for_new_question()
        powers_q2 = manager.generate_question_powers()
        
        # Todos deberían estar disponibles de nuevo
        assert len(powers_q2) == 3
        available = manager.get_available_powers()
        assert len(available) == 3
    
    def test_multiple_questions_sequence(self):
        """Test secuencia de múltiples preguntas"""
        manager = PowersManager()
        player_points = 5000
        
        for question_num in range(5):
            manager.generate_question_powers()
            
            # Usar un poder aleatorio
            if question_num % 2 == 0:
                success, result = manager.use_power("fifty_fifty", player_points)
                if success:
                    player_points = result["new_points"]
            else:
                success, result = manager.use_power("time_boost", player_points)
                if success:
                    player_points = result["new_points"]
            
            # Reseteamos para próxima pregunta
            manager.reset_for_new_question()
            
            # Verificar que se limpió correctamente
            assert len(manager.available_powers) == 0
            assert len(manager.used_powers) == 0


# Función para ejecutar todos los tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
