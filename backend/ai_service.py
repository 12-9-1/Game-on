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
    Obtiene una pregunta desde la API personalizada en español.

    Args:
        difficulty: 'easy', 'medium', o 'hard' (se mapea a los niveles de la API)
        retry: número de reintento (máximo 2)

    Returns:
        dict con la pregunta en español en el formato interno del juego
    """
    try:
        url = 'https://mi-api-preguntas.onrender.com/preguntas'

        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            raise Exception(f"Error en API personalizada: {response.status_code}")

        data = response.json()

        if not isinstance(data, list) or len(data) == 0:
            raise Exception("La API personalizada no devolvió una lista de preguntas")

        # Mapeo simple de dificultad interna -> dificultad de la API
        dificultad_map = {
            'easy': ['Fácil'],
            'medium': ['Medio'],
            'hard': ['Difícil', 'Legendario']
        }

        target_dificultades = dificultad_map.get(difficulty, [])

        if target_dificultades:
            candidates = [q for q in data if q.get('dificultad') in target_dificultades]
        else:
            candidates = []

        # Si no hay preguntas de esa dificultad, usar todas
        if not candidates:
            candidates = data

        question_data = random.choice(candidates)

        question_text_es = question_data.get('pregunta', '')
        options_es = question_data.get('opciones', [])
        correct_text = question_data.get('respuesta', '')
        category_es = question_data.get('categoria', 'General')
        dificultad_es = question_data.get('dificultad', '')

        print(f"  Pregunta recibida API personalizada: {question_text_es[:50]}...")

        # Asegurar que haya opciones
        if not options_es:
            raise Exception("Pregunta sin opciones devuelta por la API personalizada")

        # Buscar índice de la respuesta correcta
        try:
            correct_index = options_es.index(correct_text)
        except ValueError:
            # Si por alguna razón la respuesta no está en opciones, usar la primera
            print("  ⚠️ La respuesta no está en opciones, usando índice 0 por defecto")
            correct_index = 0

        result = {
            'question': question_text_es,
            'options': options_es,
            'correct_answer': correct_index,
            'difficulty': dificultad_es or difficulty,
            'category': category_es,
            'explanation': f'La respuesta correcta es: {correct_text}'
        }

        return result

    except Exception as e:
        print(f"⚠️ Error obteniendo pregunta de API personalizada: {e}")
        # Comportamiento similar al anterior: devolver None para que el llamador reintente
        if retry < 2:
            wait_time = 2 * (retry + 1)
            print(f"  ⏳ Reintentando en {wait_time}s...")
            time.sleep(wait_time)
            return get_question_from_opentdb(difficulty, retry + 1)
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
    
    # Hacer varios intentos contra la API antes de rendirse
    max_attempts = 5
    for attempt in range(1, max_attempts + 1):
        question = get_question_from_opentdb(actual_difficulty)
        if question:
            return question

        wait_time = 2 * attempt
        print(f"⚠️ Intento {attempt}/{max_attempts} fallido, reintentando en {wait_time}s...")
        time.sleep(wait_time)

    print("⚠️ No se pudo obtener pregunta de OpenTDB tras varios intentos")
    return None


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
