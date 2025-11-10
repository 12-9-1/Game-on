"""
Test de traducción mejorada
"""
from ai_service import generate_single_question_sync

print("PROBANDO TRADUCCIÓN MEJORADA")
print("=" * 70)

for i in range(3):
    print(f"\n{'='*70}")
    print(f"PREGUNTA {i+1}")
    print('='*70)
    
    question = generate_single_question_sync()
    
    if question:
        print(f"\nPregunta: {question['question']}")
        print(f"Categoría: {question['category']}")
        print(f"Dificultad: {question['difficulty']}")
        print(f"\nOpciones:")
        for j, opt in enumerate(question['options']):
            marker = "✓" if j == question['correct_answer'] else " "
            print(f"  {marker} {chr(65+j)}. {opt}")
        print(f"\n{question['explanation']}")
    else:
        print("❌ Error generando pregunta")

print("\n" + "=" * 70)
print("✅ Test completado")
print("=" * 70)
