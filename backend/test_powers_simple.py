"""
Tests unitarios para el sistema de poderes
Ejecutar con: python test_powers_simple.py
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


def run_test(description, test_func):
    """Ejecuta un test y registra el resultado"""
    global total_tests, passed_tests, failed_tests
    total_tests += 1
    try:
        test_func()
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


# ===== TESTS =====

def test_1():
    """Crear un poder correctamente"""
    power = Power(PowerType.FIFTY_FIFTY, 100, "Test", "Test effect")
    assert power.power_type == PowerType.FIFTY_FIFTY
    assert power.cost == 100


def test_2():
    """Convertir poder a diccionario"""
    power = Power(PowerType.FIFTY_FIFTY, 100, "Test", "Test effect")
    result = power.to_dict()
    assert result["power_type"] == "fifty_fifty"
    assert result["cost"] == 100


def test_3():
    """Inicializar gestor de poderes"""
    manager = PowersManager()
    assert len(manager.available_powers) == 0


def test_4():
    """Generar 3 poderes para una pregunta"""
    manager = PowersManager()
    powers = manager.generate_question_powers()
    assert len(powers) == 3


def test_5():
    """Verificar costes correctos"""
    manager = PowersManager()
    manager.generate_question_powers()
    for power in manager.available_powers:
        if power.power_type == PowerType.FIFTY_FIFTY:
            assert power.cost == 100
        elif power.power_type == PowerType.DOUBLE_POINTS:
            assert power.cost == 300
        elif power.power_type == PowerType.TIME_BOOST:
            assert power.cost == 50


def test_6():
    """Verificar disponibilidad con puntos suficientes"""
    manager = PowersManager()
    manager.generate_question_powers()
    can_use, message = manager.can_use_power("fifty_fifty", 500)
    assert can_use == True


def test_7():
    """Rechazar poder sin puntos suficientes"""
    manager = PowersManager()
    manager.generate_question_powers()
    can_use, _ = manager.can_use_power("fifty_fifty", 50)
    assert can_use == False


def test_8():
    """Usar poder exitosamente"""
    manager = PowersManager()
    manager.generate_question_powers()
    success, result = manager.use_power("fifty_fifty", 500)
    assert success == True
    assert result["new_points"] == 400


def test_9():
    """No permitir usar mismo poder dos veces"""
    manager = PowersManager()
    manager.generate_question_powers()
    manager.use_power("fifty_fifty", 500)
    success, _ = manager.use_power("fifty_fifty", 400)
    assert success == False


def test_10():
    """Aplicar efectos correctamente"""
    manager = PowersManager()
    manager.generate_question_powers()
    _, result = manager.use_power("fifty_fifty", 500)
    assert result["effect"]["type"] == "fifty_fifty"


def test_11():
    """Obtener poderes disponibles"""
    manager = PowersManager()
    manager.generate_question_powers()
    manager.use_power("fifty_fifty", 500)
    available = manager.get_available_powers()
    assert len(available) == 2


def test_12():
    """Resetear para nueva pregunta"""
    manager = PowersManager()
    manager.generate_question_powers()
    manager.use_power("fifty_fifty", 500)
    manager.reset_for_new_question()
    assert len(manager.available_powers) == 0


def test_13():
    """Todos los poderes tienen descripciones"""
    manager = PowersManager()
    manager.generate_question_powers()
    for power in manager.available_powers:
        assert len(power.description) > 0


def test_14():
    """Verificar valores de enum PowerCost"""
    assert PowerCost.FIFTY_FIFTY.value == 100
    assert PowerCost.DOUBLE_POINTS.value == 300
    assert PowerCost.TIME_BOOST.value == 50


def test_15():
    """Flujo completo de pregunta"""
    manager = PowersManager()
    powers = manager.generate_question_powers()
    assert len(powers) == 3
    manager.use_power("fifty_fifty", 1000)
    available = manager.get_available_powers()
    assert len(available) == 2
    manager.reset_for_new_question()
    powers2 = manager.generate_question_powers()
    assert len(powers2) == 3


# ===== MAIN =====

if __name__ == "__main__":
    print(f"\n{BLUE}{'='*60}")
    print("🎮 TESTS DEL SISTEMA DE PODERES")
    print(f"{'='*60}{RESET}\n")
    
    # Ejecutar todos los tests
    run_test("Crear un poder correctamente", test_1)
    run_test("Convertir poder a diccionario", test_2)
    run_test("Inicializar gestor de poderes", test_3)
    run_test("Generar 3 poderes para una pregunta", test_4)
    run_test("Verificar costes correctos", test_5)
    run_test("Verificar disponibilidad con puntos suficientes", test_6)
    run_test("Rechazar poder sin puntos suficientes", test_7)
    run_test("Usar poder exitosamente", test_8)
    run_test("No permitir usar mismo poder dos veces", test_9)
    run_test("Aplicar efectos correctamente", test_10)
    run_test("Obtener poderes disponibles", test_11)
    run_test("Resetear para nueva pregunta", test_12)
    run_test("Todos los poderes tienen descripciones", test_13)
    run_test("Verificar valores de enum PowerCost", test_14)
    run_test("Flujo completo de pregunta", test_15)
    
    # Imprimir resumen
    print(f"\n{BLUE}{'='*60}")
    print("📊 RESUMEN DE TESTS")
    print(f"{'='*60}{RESET}")
    print(f"Total:  {total_tests}")
    print(f"{GREEN}Pasados: {passed_tests}{RESET}")
    print(f"{RED}Fallos:  {failed_tests}{RESET}")
    print(f"{BLUE}{'='*60}\n{RESET}")
    
    if failed_tests == 0:
        print(f"{GREEN}✓ ¡Todos los tests pasaron! 🎉{RESET}\n")
    else:
        print(f"{RED}✗ Algunos tests fallaron{RESET}\n")
