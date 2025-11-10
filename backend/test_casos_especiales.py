"""
Test de casos especiales de traducción
"""
from ai_service import translate_text

print("TEST DE CASOS ESPECIALES")
print("=" * 70)

# Casos de prueba
test_cases = [
    # HTML tags
    ("<marquee></marquee>", "NO debe traducirse"),
    ("<mover></mover>", "NO debe traducirse"),
    ("<slide></slide>", "NO debe traducirse"),
    
    # Nombres de consolas
    ("GameCube", "NO debe traducirse"),
    ("Dreamcast", "NO debe traducirse"),
    ("SNES", "NO debe traducirse"),
    ("Wii", "NO debe traducirse"),
    
    # Nombres propios
    ("Rodrigo I", "NO debe traducirse"),
    ("Christopher Eccleston", "NO debe traducirse"),
    
    # Texto normal
    ("The capital of France", "SÍ debe traducirse"),
    ("What is the name of", "SÍ debe traducirse"),
]

for original, expectativa in test_cases:
    traducido = translate_text(original)
    cambio = "✓ OK" if (traducido == original and "NO debe" in expectativa) or (traducido != original and "SÍ debe" in expectativa) else "❌ ERROR"
    
    print(f"\n{cambio}")
    print(f"  Original:   '{original}'")
    print(f"  Traducido:  '{traducido}'")
    print(f"  Esperado:   {expectativa}")

print("\n" + "=" * 70)
