"""
Servicio de generación de preguntas de trivia
Usa Open Trivia Database API con traducción automática al español
"""
import requests
import html
import random
import time
import threading
from deep_translator import GoogleTranslator

print("✓ Servicio de trivia: Open Trivia Database + Traducción al español")

# Traductor de inglés a español
translator = GoogleTranslator(source='en', target='es')

# Palabras que NO deben traducirse (nombres propios, marcas, etc.)
NO_TRANSLATE_WORDS = {
    # Consolas de videojuegos
    'gamecube', 'dreamcast', 'playstation', 'xbox', 'wii', 'switch',
    'snes', 'nes', 'n64', 'ps1', 'ps2', 'ps3', 'ps4', 'ps5',
    'gameboy', 'ds', 'psp', 'vita', 'atari', 'sega',
    
    # Nombres comunes que se traducen mal
    'christopher', 'rodrigo', 'alexander', 'elizabeth',
    
    # Marcas y empresas
    'nintendo', 'sony', 'microsoft', 'apple', 'google',
    'facebook', 'twitter', 'youtube', 'netflix',
}


def translate_text(text):
    """
    Traduce texto de inglés a español con manejo mejorado
    
    Args:
        text: texto en inglés
    
    Returns:
        texto traducido al español
    """
    try:
        if not text or len(text) == 0:
            return text
        
        text_stripped = text.strip()
        
        # NO traducir si:
        # 1. Es un número
        if text_stripped.isdigit() or text_stripped.replace(',', '').replace('.', '').isdigit():
            return text
        
        # 2. Es código HTML/XML (contiene < >)
        if '<' in text_stripped and '>' in text_stripped:
            return text
        
        # 3. Es una palabra muy corta (probablemente acrónimo o nombre)
        if len(text_stripped) <= 3 and text_stripped.isupper():
            return text
        
        # 4. Contiene caracteres especiales de código
        if any(char in text_stripped for char in ['<', '>', '{', '}', '[', ']', '()', '//']):
            return text
        
        # 5. Está en la lista de palabras que no deben traducirse
        # Verificar palabra completa o primera palabra (para nombres compuestos)
        text_lower = text_stripped.lower()
        first_word = text_lower.split()[0] if ' ' in text_lower else text_lower
        
        if text_lower in NO_TRANSLATE_WORDS or first_word in NO_TRANSLATE_WORDS:
            return text
        
        # 6. Parece ser un nombre propio (empieza con mayúscula y es corto)
        if text_stripped[0].isupper() and len(text_stripped) < 20 and ' ' not in text_stripped:
            # Si es una sola palabra con mayúscula inicial, probablemente es nombre propio
            # Excepto palabras comunes en inglés
            common_words = {'the', 'what', 'which', 'when', 'where', 'who', 'how', 'why'}
            if text_lower not in common_words:
                return text
        
        # Traducir con contexto mejorado
        # Agregar punto al final si no tiene para mejorar la traducción
        needs_period = not text_stripped.endswith(('.', '!', '?', ','))
        text_to_translate = text_stripped + '.' if needs_period else text_stripped
        
        translated = translator.translate(text_to_translate)
        
        # Remover el punto agregado si fue necesario
        if needs_period and translated.endswith('.'):
            translated = translated[:-1]
        
        # Limpiar espacios
        translated = translated.strip()
        
        return translated
    except Exception as e:
        print(f"⚠️ Error traduciendo '{text[:30]}...': {e}")
        # Si falla la traducción, devolver el original
        return text


def get_question_from_opentdb(difficulty='medium', retry=0):
    """
    Obtiene una pregunta de Open Trivia Database API y la traduce al español
    https://opentdb.com/
    
    Args:
        difficulty: 'easy', 'medium', o 'hard'
        retry: número de reintento (máximo 2)
    
    Returns:
        dict con la pregunta en español
    """
    try:
        # Llamar a la API (solo preguntas de opción múltiple)
        url = f'https://opentdb.com/api.php?amount=1&type=multiple&difficulty={difficulty}'
        
        response = requests.get(url, timeout=10)
        
        # Si es rate limit (429), esperar y reintentar
        if response.status_code == 429 and retry < 2:
            wait_time = 2 * (retry + 1)
            print(f"  ⏳ Rate limit, esperando {wait_time}s...")
            time.sleep(wait_time)
            return get_question_from_opentdb(difficulty, retry + 1)
        
        if response.status_code != 200:
            raise Exception(f"Error en API: {response.status_code}")
        
        data = response.json()
        
        if data['response_code'] != 0:
            raise Exception(f"API retornó código: {data['response_code']}")
        
        question_data = data['results'][0]
        
        # Decodificar HTML entities
        question_text_en = html.unescape(question_data['question'])
        correct_en = html.unescape(question_data['correct_answer'])
        incorrect_en = [html.unescape(ans) for ans in question_data['incorrect_answers']]
        category_en = html.unescape(question_data['category'])
        
        print(f"  Pregunta original: {question_text_en[:50]}...")
        
        # Traducir pregunta
        question_text_es = translate_text(question_text_en)
        
        # Preparar opciones
        all_options_en = [correct_en] + incorrect_en
        
        # Verificar si alguna opción contiene HTML o código
        has_code = any('<' in opt and '>' in opt for opt in all_options_en)
        
        # Si hay código o son muy cortas, traducir individualmente
        # Si no, traducir en lote para mejor contexto
        if has_code or all(len(opt) < 15 for opt in all_options_en):
            print("  → Traducción individual (código o nombres cortos)")
            correct_es = translate_text(correct_en)
            incorrect_es = [translate_text(ans) for ans in incorrect_en]
            all_options_es = [correct_es] + incorrect_es
        else:
            # Traducir en lote con separador
            options_text = " | ".join(all_options_en)
            options_translated = translate_text(f"Options: {options_text}")
            
            # Separar las opciones traducidas
            options_es = options_translated.replace("Opciones:", "").replace("Options:", "").strip().split(" | ")
            
            # Verificar que la traducción en lote funcionó
            if len(options_es) == len(all_options_en):
                correct_es = options_es[0]
                all_options_es = options_es
            else:
                print("  ⚠️ Traducción en lote falló, traduciendo individualmente...")
                correct_es = translate_text(correct_en)
                incorrect_es = [translate_text(ans) for ans in incorrect_en]
                all_options_es = [correct_es] + incorrect_es
        
        # Traducir categoría
        category_es = translate_text(category_en)
        
        # Mezclar opciones traducidas
        random.shuffle(all_options_es)
        
        # Encontrar índice de la respuesta correcta
        correct_index = all_options_es.index(correct_es)
        
        result = {
            'question': question_text_es,
            'options': all_options_es,
            'correct_answer': correct_index,
            'difficulty': difficulty,
            'category': category_es,
            'explanation': f'La respuesta correcta es: {correct_es}'
        }
        
        print(f"  ✓ Traducida: {question_text_es[:50]}...")
        return result
        
    except Exception as e:
        print(f"⚠️ Error obteniendo pregunta de OpenTDB: {e}")
        return None


def generate_single_question_sync(difficulty='medium'):
    """
    Genera una sola pregunta de forma síncrona (sin threading)
    Útil para generación continua durante el juego
    
    Args:
        difficulty: 'easy', 'medium', o 'hard'
    
    Returns:
        dict con la pregunta en español
    """
    # Variar dificultad aleatoriamente
    difficulties = ['easy', 'easy', 'medium', 'medium', 'hard']
    actual_difficulty = random.choice(difficulties)
    
    question = get_question_from_opentdb(actual_difficulty)
    
    if not question:
        print("⚠️ No se pudo obtener pregunta")
        return None
    
    return question


def generate_round_questions(num_questions=5, difficulty='medium'):
    """
    Genera múltiples preguntas para una ronda
    
    Args:
        num_questions: número de preguntas a generar (default: 5)
        difficulty: dificultad inicial (puede variar)
    
    Returns:
        lista de preguntas en español
    """
    print(f"\n{'='*60}")
    print(f"Generando {num_questions} preguntas de trivia...")
    print(f"{'='*60}")
    
    questions = [None] * num_questions
    
    def generate_single_question(index):
        """Genera una pregunta individual en un thread separado"""
        # Delay escalonado para evitar rate limit (2 segundos entre requests)
        time.sleep(index * 2.0)
        
        # Variar la dificultad progresivamente
        if index < 2:
            current_difficulty = 'easy'
        elif index < 4:
            current_difficulty = 'medium'
        else:
            current_difficulty = 'hard'
        
        print(f"\n{index + 1}. Obteniendo pregunta ({current_difficulty})...")
        
        # Obtener pregunta de OpenTDB
        question = get_question_from_opentdb(current_difficulty)
        
        if question:
            questions[index] = question
        else:
            print(f"  ⚠️ No se pudo obtener pregunta {index + 1}")
    
    # Crear y ejecutar threads para generar preguntas en paralelo
    threads = []
    for i in range(num_questions):
        thread = threading.Thread(target=generate_single_question, args=(i,))
        thread.start()
        threads.append(thread)
    
    # Esperar a que todos los threads terminen
    for thread in threads:
        thread.join()
    
    # Filtrar None en caso de errores
    questions = [q for q in questions if q is not None]
    
    print(f"\n{'='*60}")
    print(f"✓ {len(questions)} preguntas generadas exitosamente")
    print(f"{'='*60}\n")
    
    return questions
