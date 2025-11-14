from flask_socketio import emit, join_room, leave_room
from flask import request
import uuid
from datetime import datetime
import time
from ai_service import generate_round_questions, generate_single_question_sync
from powers import PowersManager
import threading

# Almacenamiento en memoria para lobbies
lobbies = {}
# Mapeo de socket_id a lobby_id
user_lobbies = {}
# Almacenamiento de preguntas activas por lobby
active_questions = {}
# Almacenamiento de respuestas de jugadores
player_answers = {}
# Caché de preguntas usadas por lobby (para evitar repeticiones)
used_questions_cache = {}
# Cola de preguntas pre-cargadas por lobby
question_queue = {}
# Threads de generación de preguntas
generation_threads = {}
# Temporizadores de preguntas por lobby
question_timers = {}
# Gestor de poderes por lobby
powers_managers = {}

def register_socket_events(socketio):
    """Registra todos los eventos de Socket.IO"""
    
    @socketio.on('connect')
    def handle_connect():
        print(f'Cliente conectado: {request.sid}')
        emit('connected', {'message': 'Conectado al servidor'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        sid = request.sid
        print(f'Cliente desconectado: {sid}')
        
        # Remover usuario del lobby si estaba en uno
        if sid in user_lobbies:
            lobby_id = user_lobbies[sid]
            if lobby_id in lobbies:
                lobby = lobbies[lobby_id]
                player_name = None
                was_host = False
                
                # Encontrar el jugador que se desconectó
                for player in lobby['players']:
                    if player['socket_id'] == sid:
                        player_name = player['name']
                        was_host = player['is_host']
                        break
                
                # Remover jugador
                lobby['players'] = [p for p in lobby['players'] if p['socket_id'] != sid]
                
                # Si el lobby está vacío, eliminarlo
                if len(lobby['players']) == 0:
                    print(f'Eliminando lobby {lobby_id} - vacío')
                    del lobbies[lobby_id]
                    # Notificar que el lobby fue cerrado
                    emit('lobby_closed', {
                        'message': 'El lobby está vacío'
                    }, room=lobby_id)
                else:
                    # Si el host se desconectó, transferir el rol al siguiente jugador
                    if was_host and len(lobby['players']) > 0:
                        new_host = lobby['players'][0]
                        new_host['is_host'] = True
                        new_host['ready'] = False  # El nuevo host no necesita estar listo
                        lobby['host'] = new_host['socket_id']
                        print(f'Nuevo host del lobby {lobby_id}: {new_host["name"]}')
                    
                    # Actualizar el conteo de jugadores
                    lobby['player_count'] = len(lobby['players'])
                    
                    # Notificar a los demás jugadores con la estructura completa del lobby
                    print(f'Jugador {player_name} salió del lobby {lobby_id}')
                    emit('player_left', {
                        'message': f'{player_name} ha salido del lobby',
                        'lobby': lobby
                    }, room=lobby_id)
                
            del user_lobbies[sid]
    
    @socketio.on('create_lobby')
    def handle_create_lobby(data):
        sid = request.sid
        lobby_id = str(uuid.uuid4())[:8]  # ID corto de 8 caracteres
        
        player_name = data.get('player_name', 'Jugador')
        public_id = data.get('public_id', None)  # ID del usuario autenticado
        max_players = data.get('max_players', 4)
        
        # Crear nuevo lobby
        lobbies[lobby_id] = {
            'id': lobby_id,
            'host': sid,
            'players': [{
                'socket_id': sid,
                'name': player_name,
                'public_id': public_id,
                'is_host': True,
                'ready': False
            }],
            'max_players': max_players,
            'created_at': datetime.now().isoformat(),
            'status': 'waiting'  # waiting, playing, finished
        }
        
        # Unir al jugador a la sala
        join_room(lobby_id)
        user_lobbies[sid] = lobby_id
        
        print(f'Lobby creado: {lobby_id} por {player_name}')
        
        emit('lobby_created', {
            'lobby': lobbies[lobby_id],
            'message': f'Lobby {lobby_id} creado exitosamente'
        })
    
    @socketio.on('join_lobby')
    def handle_join_lobby(data):
        sid = request.sid
        lobby_id = data.get('lobby_id')
        player_name = data.get('player_name', 'Jugador')
        public_id = data.get('public_id', None)  # ID del usuario autenticado
        
        # Verificar si el lobby existe
        if lobby_id not in lobbies:
            emit('error', {'message': 'Lobby no encontrado'})
            return
        
        lobby = lobbies[lobby_id]
        
        # Verificar si el lobby está lleno
        if len(lobby['players']) >= lobby['max_players']:
            emit('error', {'message': 'Lobby lleno'})
            return
        
        # Verificar si el juego ya comenzó
        if lobby['status'] != 'waiting':
            emit('error', {'message': 'El juego ya comenzó'})
            return
        
        # Agregar jugador al lobby
        player = {
            'socket_id': sid,
            'name': player_name,
            'public_id': public_id,
            'is_host': False,
            'ready': False
        }
        lobby['players'].append(player)
        
        # Unir al jugador a la sala
        join_room(lobby_id)
        user_lobbies[sid] = lobby_id
        
        print(f'{player_name} se unió al lobby {lobby_id}')
        
        # Notificar al jugador que se unió
        emit('lobby_joined', {
            'lobby': lobby,
            'message': f'Te uniste al lobby {lobby_id}'
        })
        
        # Notificar a todos en el lobby
        emit('player_joined', {
            'lobby': lobby,
            'player': player,
            'player_count': len(lobby['players'])
        }, room=lobby_id, include_self=False)
    
    @socketio.on('leave_lobby')
    def handle_leave_lobby():
        sid = request.sid
        
        if sid not in user_lobbies:
            emit('error', {'message': 'No estás en ningún lobby'})
            return
        
        lobby_id = user_lobbies[sid]
        
        if lobby_id not in lobbies:
            del user_lobbies[sid]
            return
        
        lobby = lobbies[lobby_id]
        
        # Remover jugador
        player = next((p for p in lobby['players'] if p['socket_id'] == sid), None)
        lobby['players'] = [p for p in lobby['players'] if p['socket_id'] != sid]
        
        leave_room(lobby_id)
        del user_lobbies[sid]
        
        # Si el lobby está vacío, eliminarlo
        if len(lobby['players']) == 0:
            del lobbies[lobby_id]
            print(f'Lobby {lobby_id} eliminado (vacío)')
        else:
            # Si el host se fue, asignar nuevo host
            if player and player['is_host']:
                new_host = lobby['players'][0]
                new_host['is_host'] = True
                new_host['ready'] = False  # El nuevo host no necesita estar listo
                lobby['host'] = new_host['socket_id']
                print(f'Nuevo host del lobby {lobby_id}: {new_host["name"]}')
            
            # Notificar a los demás
            emit('player_left', {
                'lobby': lobby,
                'player_name': player['name'] if player else 'Jugador',
                'player_count': len(lobby['players'])
            }, room=lobby_id)
        
        emit('lobby_left', {'message': 'Saliste del lobby'})
    
    @socketio.on('get_lobbies')
    def handle_get_lobbies():
        # Retornar lista de lobbies disponibles
        available_lobbies = [
            {
                'id': lobby['id'],
                'player_count': len(lobby['players']),
                'max_players': lobby['max_players'],
                'status': lobby['status'],
                'host_name': lobby['players'][0]['name'] if lobby['players'] else 'Unknown'
            }
            for lobby in lobbies.values()
            if lobby['status'] == 'waiting'
        ]
        
        emit('lobbies_list', {'lobbies': available_lobbies})
    
    @socketio.on('toggle_ready')
    def handle_toggle_ready():
        sid = request.sid
        
        if sid not in user_lobbies:
            emit('error', {'message': 'No estás en ningún lobby'})
            return
        
        lobby_id = user_lobbies[sid]
        lobby = lobbies[lobby_id]
        
        # Encontrar jugador y cambiar estado ready
        for player in lobby['players']:
            if player['socket_id'] == sid:
                player['ready'] = not player['ready']
                break
        
        # Notificar a todos en el lobby
        emit('player_ready_changed', {
            'lobby': lobby
        }, room=lobby_id)
    
    def start_question_generator(lobby_id):
        """
        Inicia un thread que genera preguntas continuamente para un lobby
        """
        def generate_questions_continuously():
            print(f'Thread de generación iniciado para lobby {lobby_id}')
            while lobby_id in lobbies and lobbies[lobby_id]['status'] == 'playing':
                # Si la cola tiene menos de 2 preguntas, generar una nueva
                if lobby_id in question_queue and len(question_queue[lobby_id]) < 2:
                    print(f'Generando pregunta para cola del lobby {lobby_id}...')
                    question = generate_single_question_sync()
                    if question:
                        question_queue[lobby_id].append(question)
                        print(f'Pregunta agregada a cola. Total en cola: {len(question_queue[lobby_id])}')
                time.sleep(2)  # Esperar 2 segundos antes de verificar de nuevo
            print(f'Thread de generación terminado para lobby {lobby_id}')
        
        # Iniciar thread
        thread = threading.Thread(target=generate_questions_continuously, daemon=True)
        thread.start()
        generation_threads[lobby_id] = thread
    
    def get_next_question(lobby_id):
        """
        Obtiene la siguiente pregunta de la cola, o genera una si está vacía
        """
        if lobby_id not in question_queue:
            question_queue[lobby_id] = []
        
        # Si hay preguntas en cola, usar la primera
        if len(question_queue[lobby_id]) > 0:
            return question_queue[lobby_id].pop(0)
        
        # Si no hay preguntas en cola, generar una inmediatamente
        print(f'Cola vacía, generando pregunta inmediata...')
        return generate_single_question_sync()
    
    @socketio.on('start_game')
    def handle_start_game():
        sid = request.sid
        
        if sid not in user_lobbies:
            emit('error', {'message': 'No estás en ningún lobby'})
            return
        
        lobby_id = user_lobbies[sid]
        lobby = lobbies[lobby_id]
        
        # Verificar que sea el host
        if lobby['host'] != sid:
            emit('error', {'message': 'Solo el host puede iniciar el juego'})
            return
        
        # Verificar que todos estén listos (excepto el host)
        all_ready = all(p['ready'] or p['is_host'] for p in lobby['players'])
        
        if not all_ready:
            emit('error', {'message': 'No todos los jugadores están listos'})
            return
        
        # Cambiar estado del lobby
        lobby['status'] = 'playing'
        lobby['win_score'] = 10000  # Puntos necesarios para ganar
        
        # Inicializar puntuaciones
        for player in lobby['players']:
            player['score'] = 0
        
        # Inicializar cola de preguntas
        question_queue[lobby_id] = []
        
        # Generar primera pregunta inmediatamente
        print(f'Generando primera pregunta para el lobby {lobby_id}...')
        first_question = generate_single_question_sync()
        
        if not first_question:
            emit('error', {'message': 'Error generando pregunta inicial'})
            return
        
        # Inicializar datos del juego
        active_questions[lobby_id] = {
            'current_question': first_question,
            'question_number': 1
        }
        
        # Iniciar generador de preguntas en background
        start_question_generator(lobby_id)
        
        # Notificar a todos que el juego comienza
        emit('game_started', {
            'lobby': lobby,
            'win_score': 10000,
            'message': '¡Primero en llegar a 10,000 puntos gana!'
        }, room=lobby_id)
        
        # Emitir actualización del lobby con puntuaciones iniciales
        emit('lobby_updated', {
            'lobby': lobby
        }, room=lobby_id)
        
        # Enviar la primera pregunta después de 2 segundos
        socketio.sleep(2)
        send_next_question(lobby_id, socketio)
    
    def send_next_question(lobby_id, socketio):
        """Envía la siguiente pregunta a todos los jugadores del lobby"""
        if lobby_id not in active_questions:
            return
        
        if lobby_id not in lobbies:
            return
        
        lobby = lobbies[lobby_id]
        question_data = active_questions[lobby_id]
        question = question_data['current_question']
        
        # Generar poderes para esta pregunta
        if lobby_id not in powers_managers:
            powers_managers[lobby_id] = PowersManager()
        
        powers_manager = powers_managers[lobby_id]
        powers_manager.reset_for_new_question()
        powers = powers_manager.generate_question_powers()
        
        # Preparar pregunta sin la respuesta correcta
        question_to_send = {
            'question': question['question'],
            'options': question['options'],
            'difficulty': question['difficulty'],
            'category': question['category'],
            'question_number': question_data['question_number'],
            'time_limit': 30,  # 30 segundos para responder
            'powers': powers  # ← AGREGAR PODERES
        }
        
        # Inicializar respuestas para esta pregunta
        player_answers[lobby_id] = {
            'start_time': time.time(),
            'answers': {},
            'correct_answer': question['correct_answer']
        }
        
        print(f'Enviando pregunta #{question_data["question_number"]} con poderes al lobby {lobby_id}')
        
        # Enviar pregunta a todos los jugadores
        socketio.emit('new_question', question_to_send, room=lobby_id)
        
        # Emitir actualización del lobby con puntuaciones
        socketio.emit('lobby_updated', {
            'lobby': lobby
        }, room=lobby_id)
        
        # Cancelar temporizador anterior si existe
        if lobby_id in question_timers and question_timers[lobby_id]:
            try:
                question_timers[lobby_id].cancel()
            except:
                pass
        
        # Crear temporizador automático para avanzar cuando se acabe el tiempo
        def auto_advance():
            """Avanza automáticamente a la siguiente pregunta cuando se acaba el tiempo"""
            if lobby_id not in lobbies or lobby_id not in active_questions:
                return
            
            lobby = lobbies[lobby_id]
            
            # Marcar como respondido (incorrectamente) a los jugadores que no respondieron
            if lobby_id in player_answers:
                for player in lobby['players']:
                    sid = player['socket_id']
                    if sid not in player_answers[lobby_id]['answers']:
                        player_answers[lobby_id]['answers'][sid] = {
                            'answer_index': -1,
                            'is_correct': False,
                            'points': 0,
                            'response_time': 30
                        }
            
            print(f'⏰ Tiempo agotado para pregunta en lobby {lobby_id}, avanzando...')
            
            # Esperar 2 segundos para que vean que se acabó el tiempo
            socketio.sleep(2)
            
            # Obtener siguiente pregunta
            next_question = get_next_question(lobby_id)
            
            if next_question:
                active_questions[lobby_id]['current_question'] = next_question
                active_questions[lobby_id]['question_number'] += 1
                send_next_question(lobby_id, socketio)
            else:
                print('No hay más preguntas disponibles')
                end_game(lobby_id, socketio)
        
        # Iniciar temporizador (32 segundos: 30 de pregunta + 2 de margen)
        timer = threading.Timer(32.0, auto_advance)
        timer.daemon = True
        timer.start()
        question_timers[lobby_id] = timer
    
    def end_game(lobby_id, socketio):
        """Finaliza el juego y muestra resultados"""
        if lobby_id not in lobbies:
            return
        
        # Cancelar temporizador si existe
        if lobby_id in question_timers and question_timers[lobby_id]:
            try:
                question_timers[lobby_id].cancel()
            except:
                pass
        
        lobby = lobbies[lobby_id]
        lobby['status'] = 'round_finished'
        
        # Ordenar jugadores por puntuación
        sorted_players = sorted(
            lobby['players'],
            key=lambda p: p.get('score', 0),
            reverse=True
        )
        
        results = [
            {
                'name': player['name'],
                'score': player.get('score', 0),
                'rank': idx + 1
            }
            for idx, player in enumerate(sorted_players)
        ]
        
        print(f'Ronda terminada en lobby {lobby_id}')
        
        # Registrar victoria del ganador si está autenticado
        if results and sorted_players:
            winner = sorted_players[0]
            if winner.get('public_id'):  # Solo si el usuario está autenticado
                from auth import incrementar_partidas_ganadas
                incrementar_partidas_ganadas(winner['public_id'])
                print(f"Victoria registrada para usuario: {winner['name']}")
        
        # Enviar resultados de la ronda
        socketio.emit('round_ended', {
            'results': results,
            'winner': results[0] if results else None
        }, room=lobby_id)
        
        # Emitir actualización del lobby con puntuaciones finales
        socketio.emit('lobby_updated', {
            'lobby': lobby
        }, room=lobby_id)
        
        # Limpiar datos de la ronda actual
        if lobby_id in active_questions:
            del active_questions[lobby_id]
        if lobby_id in player_answers:
            del player_answers[lobby_id]
    
    @socketio.on('submit_answer')
    def handle_submit_answer(data):
        """Maneja la respuesta de un jugador"""
        sid = request.sid
        
        if sid not in user_lobbies:
            emit('error', {'message': 'No estás en ningún lobby'})
            return
        
        lobby_id = user_lobbies[sid]
        
        if lobby_id not in lobbies or lobby_id not in active_questions:
            emit('error', {'message': 'No hay juego activo'})
            return
        
        lobby = lobbies[lobby_id]
        question_data = active_questions[lobby_id]
        current_question = question_data['current_question']
        
        # Verificar si el jugador ya respondió
        if lobby_id in player_answers:
            if sid in player_answers[lobby_id]['answers']:
                emit('error', {'message': 'Ya respondiste esta pregunta'})
                return
        
        answer_index = data.get('answer_index')
        answer_time = time.time()
        
        # Calcular tiempo de respuesta
        start_time = player_answers[lobby_id]['start_time']
        response_time = answer_time - start_time
        
        # Verificar si la respuesta es correcta
        correct_answer = player_answers[lobby_id]['correct_answer']
        is_correct = answer_index == correct_answer
        
        # Calcular puntos (más puntos por respuestas rápidas y correctas)
        points = 0
        if is_correct:
            # Base: 1000 puntos
            # Bonus por velocidad: hasta 500 puntos adicionales
            time_bonus = max(0, 500 - int(response_time * 20))
            points = 1000 + time_bonus
        
        # Actualizar puntuación del jugador
        player_name = None
        player_score = 0
        for player in lobby['players']:
            if player['socket_id'] == sid:
                player['score'] = player.get('score', 0) + points
                player_name = player['name']
                player_score = player['score']
                break
        
        # Guardar respuesta
        player_answers[lobby_id]['answers'][sid] = {
            'answer_index': answer_index,
            'is_correct': is_correct,
            'points': points,
            'response_time': response_time
        }
        
        # Notificar al jugador su resultado
        emit('answer_result', {
            'is_correct': is_correct,
            'points': points,
            'total_score': player_score,
            'correct_answer': correct_answer,
            'explanation': current_question.get('explanation', '')
        })
        
        # Notificar a todos que un jugador respondió
        emit('player_answered', {
            'player_name': player_name,
            'total_answered': len(player_answers[lobby_id]['answers']),
            'total_players': len(lobby['players'])
        }, room=lobby_id)
        
        # Emitir actualización del lobby con puntuaciones actualizadas
        emit('lobby_updated', {
            'lobby': lobby
        }, room=lobby_id)
        
        # Verificar si alguien ganó (llegó a 10,000 puntos)
        if player_score >= lobby.get('win_score', 10000):
            print(f'¡{player_name} ganó con {player_score} puntos!')
            
            # Cancelar temporizador ya que el juego terminó
            if lobby_id in question_timers and question_timers[lobby_id]:
                try:
                    question_timers[lobby_id].cancel()
                except:
                    pass
            
            socketio.sleep(2)
            end_game(lobby_id, socketio)
            return
        
        # Si todos respondieron, pasar a la siguiente pregunta
        if len(player_answers[lobby_id]['answers']) >= len(lobby['players']):
            # Cancelar el temporizador automático ya que todos respondieron
            if lobby_id in question_timers and question_timers[lobby_id]:
                try:
                    question_timers[lobby_id].cancel()
                    print(f'✓ Todos respondieron, cancelando temporizador automático')
                except:
                    pass
            
            socketio.sleep(3)  # Esperar 3 segundos para que vean la explicación
            
            # Obtener siguiente pregunta de la cola
            next_question = get_next_question(lobby_id)
            
            if next_question:
                active_questions[lobby_id]['current_question'] = next_question
                active_questions[lobby_id]['question_number'] += 1
                send_next_question(lobby_id, socketio)
            else:
                print('No hay más preguntas disponibles')
                end_game(lobby_id, socketio)
    
    @socketio.on('time_up')
    def handle_time_up():
        """Maneja cuando se acaba el tiempo para una pregunta (solo marca como no respondido)"""
        sid = request.sid
        
        if sid not in user_lobbies:
            return
        
        lobby_id = user_lobbies[sid]
        
        if lobby_id not in active_questions or lobby_id not in player_answers:
            return
        
        # Si el jugador no respondió, registrar como respuesta incorrecta
        # El temporizador automático se encargará de avanzar cuando todos respondan o se acabe el tiempo
        if sid not in player_answers[lobby_id]['answers']:
            player_answers[lobby_id]['answers'][sid] = {
                'answer_index': -1,
                'is_correct': False,
                'points': 0,
                'response_time': 30
            }
        
        # No necesitamos avanzar manualmente aquí, el temporizador automático lo hace
    
    @socketio.on('request_new_round')
    def handle_request_new_round():
        """Maneja la solicitud de una nueva ronda"""
        sid = request.sid
        
        if sid not in user_lobbies:
            emit('error', {'message': 'No estás en ningún lobby'})
            return
        
        lobby_id = user_lobbies[sid]
        
        if lobby_id not in lobbies:
            emit('error', {'message': 'Lobby no encontrado'})
            return
        
        lobby = lobbies[lobby_id]
        
        # Verificar que sea el host
        if lobby['host'] != sid:
            emit('error', {'message': 'Solo el host puede iniciar una nueva ronda'})
            return
        
        # Cambiar estado a waiting_new_round
        lobby['status'] = 'waiting_new_round'
        
        # Resetear estado ready de todos los jugadores
        for player in lobby['players']:
            if not player['is_host']:
                player['ready'] = False
        
        print(f'Nueva ronda solicitada en lobby {lobby_id}')
        
        # Notificar a todos que se espera una nueva ronda
        emit('waiting_new_round', {
            'lobby': lobby,
            'message': 'Esperando a que todos estén listos para la nueva ronda'
        }, room=lobby_id)
    
    @socketio.on('ready_for_new_round')
    def handle_ready_for_new_round():
        """Maneja cuando un jugador está listo para la nueva ronda"""
        sid = request.sid
        
        if sid not in user_lobbies:
            emit('error', {'message': 'No estás en ningún lobby'})
            return
        
        lobby_id = user_lobbies[sid]
        lobby = lobbies[lobby_id]
        
        # Marcar jugador como listo
        for player in lobby['players']:
            if player['socket_id'] == sid:
                player['ready'] = True
                break
        
        # Notificar a todos
        emit('player_ready_changed', {
            'lobby': lobby
        }, room=lobby_id)
        
        # Verificar si todos están listos
        all_ready = all(p['ready'] or p['is_host'] for p in lobby['players'])
        
        if all_ready:
            # Iniciar nueva ronda
            lobby['status'] = 'playing'
            
            # Resetear puntuaciones para nueva ronda
            for player in lobby['players']:
                player['score'] = 0
            
            # Generar nuevas preguntas
            print(f'Generando nuevas preguntas para el lobby {lobby_id}...')
            print(f'Preguntas ya usadas en este lobby: {len(used_questions_cache.get(lobby_id, []))}')
            
            questions = generate_round_questions(num_questions=5)
            
            # Guardar nuevas preguntas en el caché
            if lobby_id not in used_questions_cache:
                used_questions_cache[lobby_id] = []
            
            for q in questions:
                if 'question' in q:
                    used_questions_cache[lobby_id].append(q['question'])
            
            # Almacenar preguntas del lobby
            active_questions[lobby_id] = {
                'questions': questions,
                'current_question_index': 0,
                'total_questions': len(questions)
            }
            
            # Notificar que la nueva ronda comienza
            emit('new_round_started', {
                'lobby': lobby,
                'total_questions': len(questions),
                'message': '¡Nueva ronda comenzando!'
            }, room=lobby_id)
            
            # Emitir actualización del lobby con puntuaciones reseteadas
            emit('lobby_updated', {
                'lobby': lobby
            }, room=lobby_id)
            
            # Enviar la primera pregunta después de 2 segundos
            socketio.sleep(2)
            send_next_question(lobby_id, socketio)
    
    @socketio.on('back_to_lobby')
    def handle_back_to_lobby():
        """Maneja cuando el host decide volver al lobby"""
        sid = request.sid
        
        if sid not in user_lobbies:
            emit('error', {'message': 'No estás en ningún lobby'})
            return
        
        lobby_id = user_lobbies[sid]
        
        if lobby_id not in lobbies:
            emit('error', {'message': 'Lobby no encontrado'})
            return
        
        lobby = lobbies[lobby_id]
        
        # Verificar que sea el host
        if lobby['host'] != sid:
            emit('error', {'message': 'Solo el host puede volver al lobby'})
            return
        
        # Cambiar estado a waiting
        lobby['status'] = 'waiting'
        
        # Resetear puntuaciones y estado ready
        for player in lobby['players']:
            player['score'] = 0
            if not player['is_host']:
                player['ready'] = False
        
        # Limpiar datos del juego
        if lobby_id in active_questions:
            del active_questions[lobby_id]
        if lobby_id in player_answers:
            del player_answers[lobby_id]
        # Limpiar caché de preguntas al volver al lobby
        if lobby_id in used_questions_cache:
            del used_questions_cache[lobby_id]
        
        print(f'Volviendo al lobby {lobby_id}')
        
        # Notificar a todos que vuelven al lobby
        emit('returned_to_lobby', {
            'lobby': lobby,
            'message': 'Volviendo al lobby'
        }, room=lobby_id, include_self=True, broadcast=True)

    @socketio.on('use_power')
    def handle_use_power(data):
        """Maneja el uso de un poder por parte del jugador"""
        sid = request.sid

        if sid not in user_lobbies:
            emit('error', {'message': 'No estás en ningún lobby'})
            return

        lobby_id = user_lobbies[sid]
        power_type = data.get('power_type')
        current_points = data.get('current_points', 0)

        if lobby_id not in powers_managers:
            emit('error', {'message': 'No hay poderes disponibles'})
            return

        # Obtener el gestor de poderes
        powers_manager = powers_managers[lobby_id]

        # Intentar usar el poder
        success, result = powers_manager.use_power(power_type, current_points)

        if success:
            print(f'Poder {power_type} usado exitosamente en lobby {lobby_id}')

            # Preparar el efecto con información adicional para 50/50
            effect = result['effect']
            if power_type == 'fifty_fifty' and lobby_id in active_questions:
                q = active_questions[lobby_id]
                # active_questions puede tener distintas estructuras según la función que lo inicializó
                question = None
                if isinstance(q, dict):
                    question = q.get('current_question') or q.get('question') or q.get('questions')
                    if isinstance(question, list) and len(question) > 0:
                        question = question[0]
                if question:
                    # Preferir 'correct_answer_index' si existe, si no usar 'correct_answer'
                    effect['correct_index'] = question.get('correct_answer_index', question.get('correct_answer', 0))

            emit('power_used', {
                'success': True,
                'power_type': power_type,
                'new_points': result['new_points'],
                'cost': result['cost'],
                'effect': effect
            })

            # Notificar a otros jugadores (opcional)
            emit('player_used_power', {
                'player_name': next((p['name'] for p in lobbies[lobby_id]['players'] if p['socket_id'] == sid), 'Jugador'),
                'power_type': power_type,
                'effect': result['effect']
            }, room=lobby_id, skip_sid=request.sid)
        else:
            print(f'Error al usar poder: {result.get("error", "Desconocido")}')
            emit('power_error', {
                'error': result.get('error', 'Error al usar poder')
            })

    @socketio.on('send_chat_message')
    def handle_send_chat_message(data):
        """Maneja el envío de mensajes de chat"""
        sid = request.sid

        if sid not in user_lobbies:
            emit('error', {'message': 'No estás en ningún lobby'})
            return

        lobby_id = user_lobbies[sid]
        lobby = lobbies[lobby_id]

        # Encontrar el jugador que envió el mensaje
        player = next((p for p in lobby['players'] if p['socket_id'] == sid), None)
        if not player:
            emit('error', {'message': 'Jugador no encontrado'})
            return

        message = data.get('message', '').strip()
        if not message:
            return

        # Crear mensaje de chat
        chat_message = {
            'socket_id': sid,
            'player_name': player['name'],
            'message': message,
            'timestamp': datetime.now().isoformat()
        }

        # Enviar mensaje a todos en el lobby
        emit('chat_message', chat_message, room=lobby_id)

    @socketio.on('get_lobby_update')
    def handle_get_lobby_update():
        """Envía la actualización del lobby con puntuaciones"""
        sid = request.sid

        if sid not in user_lobbies:
            return

        lobby_id = user_lobbies[sid]
        if lobby_id not in lobbies:
            return

        lobby = lobbies[lobby_id]

        # Enviar actualización del lobby
        emit('lobby_updated', {
            'lobby': lobby
        })

