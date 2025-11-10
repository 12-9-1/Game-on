from ai_service import generate_round_questions

print("=" * 70)
print("GENERANDO 5 PREGUNTAS PARA UNA RONDA")
print("=" * 70)
print("\nEsto tomará ~6 segundos (respetando rate limits)...\n")

questions = generate_round_questions(num_questions=5)

print(f"\n✅ {len(questions)} preguntas generadas:\n")

for i, q in enumerate(questions, 1):
    print(f"{i}. {q['question']}")
    print(f"   Categoría: {q.get('category', 'N/A')}")
    print(f"   Dificultad: {q['difficulty']}")
    print(f"   Respuesta correcta: {q['options'][q['correct_answer']]}")
    print()

print("=" * 70)
print("✅ ¡PERFECTO! Open Trivia DB funcionando correctamente")
print("=" * 70)
