from flask_socketio import emit, join_room, leave_room
from flask import request
import uuid
from datetime import datetime
import time
from ai_service import generate_round_questions, generate_single_question_sync
from powers import GamePowersManager  # ⭐ CAMBIO: Importar el gestor global
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
# ⭐ CAMBIO: Gestor global de poderes (uno por lobby, que mantiene managers individuales por jugador)
game_powers_managers = {}

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
        
        # ⭐ NUEVO: Limpiar manager de poderes del jugador
        if sid in user_lobbies:
            lobby_id = user_lobbies[sid]
            if lobby_id in game_powers_managers:
                game_powers_managers[lobby_id].remove_player(sid)
        
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
                    # Limpiar gestor de poderes del lobby
                    if lobby_id in game_powers_managers:
                        del game_powers_managers[lobby_id]
                    # Notificar que el lobby fue cerrado
                    emit('lobby_closed', {
                        'message': 'El lobby está vacío'
                    }, room=lobby_id)
                else:
                    # Si el juego está en curso y solo queda un jugador, ese jugador gana
                    if lobby.get('status') == 'playing' and len(lobby['players']) == 1:
                        print(f"Solo queda un jugador en lobby {lobby_id} tras desconexión, finalizando partida")
                        end_game(lobby_id, socketio)
                    else:
                        # Si el host se desconectó, transferir el rol al siguiente jugador
                        if was_host and len(lobby['players']) > 0:
                            new_host = lobby['players'][0]
                            new_host['is_host'] = True
                            new_host['ready'] = False
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
                        # Enviar también lobby_updated para que todos los clientes actualicen host/estado
                        emit('lobby_updated', {
                            'lobby': lobby
                        }, room=lobby_id)
                
            del user_lobbies[sid]
    
    @socketio.on('create_lobby')
    def handle_create_lobby(data):
        sid = request.sid
        player_name = data.get('player_name', 'Jugador')
        public_id = data.get('public_id', None)
        max_players = data.get('max_players', 4)
        
        # Verificar si el usuario autenticado ya está en otro lobby
        if public_id:
            for lobby_id, lobby in lobbies.items():
                for player in lobby['players']:
                    if player.get('public_id') == public_id:
                        emit('error', {'message': 'Ya estás en otro lobby. Sal de él primero.'})
                        return
        
        lobby_id = str(uuid.uuid4())[:8]
        
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
            'status': 'waiting'
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
        public_id = data.get('public_id', None)
        
        # Verificar si el lobby existe
        if lobby_id not in lobbies:
            emit('error', {'message': 'Lobby no encontrado'})
            return
        
        lobby = lobbies[lobby_id]
        
        # Verificar si el usuario autenticado ya está en este lobby
        if public_id:
            for player in lobby['players']:
                if player.get('public_id') == public_id:
                    emit('error', {'message': 'Ya estás en este lobby con otra conexión'})
                    return
        
        # Verificar si el lobby está lleno
        if len(lobby['players']) >= lobby['max_players']:
            emit('error', {'message': 'Lobby lleno'})
            return
        
        # Nota: permitir unirse incluso si el juego está en progreso (jugarán desde la siguiente pregunta)
        
        # Agregar jugador al lobby
        player = {
            'socket_id': sid,
            'name': player_name,
            'public_id': public_id,
            'is_host': False,
            'ready': False
        }
        
        # Si el juego está en progreso, inicializar puntuación del nuevo jugador
        if lobby['status'] == 'playing':
            player['score'] = 0
            player['active_powers'] = {}
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
        
        # ⭐ NUEVO: Limpiar manager de poderes del jugador
        if lobby_id in game_powers_managers:
            game_powers_managers[lobby_id].remove_player(sid)
        
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
            # Limpiar gestor de poderes
            if lobby_id in game_powers_managers:
                del game_powers_managers[lobby_id]
            print(f'Lobby {lobby_id} eliminado (vacío)')
        else:
            # Si el juego está en curso y solo queda un jugador, ese jugador gana
            if lobby.get('status') == 'playing' and len(lobby['players']) == 1:
                # Promover al único jugador restante como nuevo host
                remaining_player = lobby['players'][0]
                lobby['host'] = remaining_player.get('socket_id')
                for p in lobby['players']:
                    p['is_host'] = (p is remaining_player)

                print(f"[HOST-REASSIGN] Unico jugador restante {remaining_player.get('name')} ({remaining_player.get('socket_id')}) ahora es host del lobby {lobby_id}")

                print(f"Solo queda un jugador en lobby {lobby_id} tras leave_lobby, finalizando partida")
                end_game(lobby_id, socketio)
            else:
                # Si el host se fue, asignar nuevo host
                if player and player['is_host']:
                    new_host = lobby['players'][0]
                    new_host['is_host'] = True
                    new_host['ready'] = False
                    lobby['host'] = new_host['socket_id']
                    print(f'Nuevo host del lobby {lobby_id}: {new_host["name"]}')
                
                # Notificar a los demás
                emit('player_left', {
                    'lobby': lobby,
                    'player_name': player['name'] if player else 'Jugador',
                    'player_count': len(lobby['players'])
                }, room=lobby_id)

                # Enviar también lobby_updated para que todos los clientes actualicen host/estado
                emit('lobby_updated', {
                    'lobby': lobby
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
        """Inicia un thread que genera preguntas continuamente para un lobby"""
        def generate_questions_continuously():
            print(f'Thread de generación iniciado para lobby {lobby_id}')
            while lobby_id in lobbies and lobbies[lobby_id]['status'] == 'playing':
                if lobby_id in question_queue and len(question_queue[lobby_id]) < 2:
                    print(f'Generando pregunta para cola del lobby {lobby_id}...')
                    # Obtener pregunta real desde el servicio de trivia (OpenTDB)
                    question = generate_single_question_sync()
                    if question:
                        question_queue[lobby_id].append(question)
                        print(f'Pregunta agregada a cola. Total en cola: {len(question_queue[lobby_id])}')
                time.sleep(2)
            print(f'Thread de generación terminado para lobby {lobby_id}')
        
        thread = threading.Thread(target=generate_questions_continuously, daemon=True)
        thread.start()
        generation_threads[lobby_id] = thread
    
    def get_next_question(lobby_id):
        """Obtiene la siguiente pregunta de la cola, o genera una si está vacía"""
        if lobby_id not in question_queue:
            question_queue[lobby_id] = []
        
        if len(question_queue[lobby_id]) > 0:
            return question_queue[lobby_id].pop(0)
        
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
        
        # Verificar que todos estén listos
        all_ready = all(p['ready'] or p['is_host'] for p in lobby['players'])
        
        if not all_ready:
            emit('error', {'message': 'No todos los jugadores están listos'})
            return
        
        # Cambiar estado del lobby
        lobby['status'] = 'playing'
        lobby['win_score'] = 10000
        
        # Inicializar puntuaciones
        for player in lobby['players']:
            player['score'] = 0
            player['active_powers'] = {}
        
        # Inicializar cola de preguntas
        question_queue[lobby_id] = []

        # ⭐ NUEVO: Inicializar gestor global de poderes para este lobby
        game_powers_managers[lobby_id] = GamePowersManager()
        
        # Generar primera pregunta
        print(f'Generando primera pregunta para el lobby {lobby_id}...')
        first_question = None
        max_attempts = 3
        for attempt in range(1, max_attempts + 1):
            try:
                print(f'  Intento {attempt} de {max_attempts}...')
                first_question = generate_single_question_sync()
                if first_question:
                    break
            except Exception as e:
                print(f'  Error: {e}')
            time.sleep(1)

        if not first_question:
            print(f'⚠️ Usando pregunta de fallback')
            first_question = {
                'question': '¿Cuánto es 2 + 2?',
                'options': ['1', '2', '3', '4'],
                'correct_answer': 3,
                'difficulty': 'easy',
                'category': 'General',
                'explanation': '2 + 2 = 4'
            }
        
        active_questions[lobby_id] = {
            'current_question': first_question,
            'question_number': 1
        }
        
        # Iniciar generador de preguntas
        start_question_generator(lobby_id)
        
        # Notificar que el juego comienza
        emit('game_started', {
            'lobby': lobby,
            'win_score': 10000,
            'message': '¡Primero en llegar a 10,000 puntos gana!'
        }, room=lobby_id)
        
        socketio.emit('lobby_updated', {'lobby': lobby}, room=lobby_id)
        
        # Enviar primera pregunta
        socketio.sleep(2)
        send_next_question(lobby_id, socketio)
    
    def send_next_question(lobby_id, socketio):
        """Envía la siguiente pregunta a todos los jugadores del lobby"""
        if lobby_id not in active_questions or lobby_id not in lobbies:
            return
        
        lobby = lobbies[lobby_id]
        question_data = active_questions[lobby_id]
        question = question_data['current_question']
        
        # ⭐ NUEVO: Resetear poderes para nueva pregunta (limpia flags de doble puntos)
        if lobby_id in game_powers_managers:
            game_powers_managers[lobby_id].reset_all_for_new_question()
        
        # ⭐ NUEVO: Enviar pregunta personalizada a CADA jugador con SUS poderes
        for player in lobby['players']:
            socket_id = player['socket_id']
            
            # Obtener manager individual del jugador
            if lobby_id not in game_powers_managers:
                game_powers_managers[lobby_id] = GamePowersManager()
            
            player_manager = game_powers_managers[lobby_id].get_or_create_manager(socket_id)
            
            # Generar poderes con el estado actual del jugador
            powers = player_manager.generate_question_powers(
                player_used_powers=player_manager.get_used_powers()
            )
            
            # Preparar pregunta personalizada para este jugador
            question_to_send = {
                'question': question['question'],
                'options': question['options'],
                'difficulty': question['difficulty'],
                'category': question['category'],
                'question_number': question_data['question_number'],
                'time_limit': 30,
                'powers': powers,  # ⭐ Poderes INDIVIDUALES del jugador
                'players_answered': 0,
                'total_players': len(lobby['players'])
            }
            
            # ⭐ Enviar SOLO a este jugador
            socketio.emit('new_question', question_to_send, room=socket_id)
        
        # Inicializar respuestas para esta pregunta
        player_answers[lobby_id] = {
            'start_time': time.time(),
            'answers': {},
            'correct_answer': question['correct_answer']
        }
        
        print(f'Enviando pregunta #{question_data["question_number"]} con poderes individuales al lobby {lobby_id}')

        # Usar socketio.emit porque esta función también se llama desde
        # threads en background (auto_advance), donde no hay contexto de request.
        socketio.emit('lobby_updated', {'lobby': lobby}, room=lobby_id)
        
        # Cancelar temporizador anterior
        if lobby_id in question_timers and question_timers[lobby_id]:
            try:
                question_timers[lobby_id].cancel()
            except:
                pass
        
        def auto_advance():
            if lobby_id not in lobbies or lobby_id not in active_questions:
                return
            
            lobby = lobbies[lobby_id]
            
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
            
            print(f'⏰ Tiempo agotado en lobby {lobby_id}')
            socketio.sleep(2)
            
            next_question = get_next_question(lobby_id)
            
            if next_question:
                active_questions[lobby_id]['current_question'] = next_question
                active_questions[lobby_id]['question_number'] += 1
                send_next_question(lobby_id, socketio)
            else:
                end_game(lobby_id, socketio)
        
        timer = threading.Timer(32.0, auto_advance)
        timer.daemon = True
        timer.start()
        question_timers[lobby_id] = timer
    
    def end_game(lobby_id, socketio):
        """Finaliza el juego y muestra resultados"""
        if lobby_id not in lobbies:
            return
        
        if lobby_id in question_timers and question_timers[lobby_id]:
            try:
                question_timers[lobby_id].cancel()
            except:
                pass
        
        lobby = lobbies[lobby_id]
        lobby['status'] = 'round_finished'

        # Resetear estado ready de todos los jugadores para la pantalla de fin de ronda
        for player in lobby['players']:
            player['ready'] = False

        # Asegurar que haya un host válido: si el host actual ya no está
        # entre los jugadores (por ejemplo, se desconectó antes),
        # promover al primer jugador restante como nuevo host.
        current_host_id = lobby.get('host')
        socket_ids = [p.get('socket_id') for p in lobby['players']]
        if current_host_id not in socket_ids and lobby['players']:
            new_host = lobby['players'][0]
            lobby['host'] = new_host.get('socket_id')
            for player in lobby['players']:
                player['is_host'] = player is new_host

            print(f"[HOST-REASSIGN] end_game: nuevo host {new_host.get('name')} ({new_host.get('socket_id')}) en lobby {lobby_id}")
        
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
        
        # Registrar victoria
        if results and sorted_players:
            winner = sorted_players[0]
            if winner.get('public_id'):
                from auth import incrementar_partidas_ganadas
                incrementar_partidas_ganadas(winner['public_id'])
                print(f"Victoria registrada para: {winner['name']}")
        
        solo_player = len(lobby['players']) == 1
        
        socketio.emit('round_ended', {
            'results': results,
            'winner': results[0] if results else None,
            'solo_player': solo_player
        }, room=lobby_id)

        socketio.emit('lobby_updated', {'lobby': lobby}, room=lobby_id)
        
        # Limpiar datos
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
        
        if lobby_id in player_answers:
            if sid in player_answers[lobby_id]['answers']:
                emit('error', {'message': 'Ya respondiste esta pregunta'})
                return
        
        answer_index = data.get('answer_index')
        answer_time = time.time()
        
        start_time = player_answers[lobby_id]['start_time']
        response_time = answer_time - start_time
        
        correct_answer = player_answers[lobby_id]['correct_answer']
        is_correct = answer_index == correct_answer
        
        # Calcular puntos base
        points = 0
        if is_correct:
            time_bonus = max(0, 500 - int(response_time * 20))
            points = 1000 + time_bonus
        
        # ⭐ NUEVO: Aplicar doble puntos si el jugador lo tiene activo
        player_name = None
        player_score = 0
        for player in lobby['players']:
            if player['socket_id'] == sid:
                # Verificar si tiene doble puntos activo desde su manager personal
                if lobby_id in game_powers_managers:
                    player_manager = game_powers_managers[lobby_id].get_or_create_manager(sid)
                    if is_correct and player_manager.has_double_points_active():
                        points *= 2
                        player_manager.clear_double_points()
                        print(f'Doble puntos aplicado! {points} puntos para {player["name"]}')

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
        
        # Notificar resultado
        emit('answer_result', {
            'is_correct': is_correct,
            'points': points,
            'total_score': player_score,
            'correct_answer': correct_answer,
            'explanation': current_question.get('explanation', '')
        })
        
        # Notificar que respondió
        emit('player_answered', {
            'player_name': player_name,
            'total_answered': len(player_answers[lobby_id]['answers']),
            'total_players': len(lobby['players'])
        }, room=lobby_id)
        
        emit('lobby_updated', {'lobby': lobby}, room=lobby_id)
        
        # Verificar victoria
        if player_score >= lobby.get('win_score', 10000):
            print(f'¡{player_name} ganó con {player_score} puntos!')
            
            if lobby_id in question_timers and question_timers[lobby_id]:
                try:
                    question_timers[lobby_id].cancel()
                except:
                    pass
            
            socketio.sleep(2)
            end_game(lobby_id, socketio)
            return
        
        # Si todos respondieron, siguiente pregunta
        if len(player_answers[lobby_id]['answers']) >= len(lobby['players']):
            if lobby_id in question_timers and question_timers[lobby_id]:
                try:
                    question_timers[lobby_id].cancel()
                    print(f'✓ Todos respondieron')
                except:
                    pass
            
            socketio.sleep(3)
            
            next_question = get_next_question(lobby_id)
            
            if next_question:
                active_questions[lobby_id]['current_question'] = next_question
                active_questions[lobby_id]['question_number'] += 1
                send_next_question(lobby_id, socketio)
            else:
                end_game(lobby_id, socketio)
    
    @socketio.on('time_up')
    def handle_time_up():
        """Maneja cuando se acaba el tiempo"""
        sid = request.sid
        
        if sid not in user_lobbies:
            return
        
        lobby_id = user_lobbies[sid]

        # Solo registrar que este jugador no respondió; el avance de pregunta
        # lo maneja el temporizador auto_advance de send_next_question.
        if lobby_id not in active_questions or lobby_id not in player_answers:
            return

        if sid not in player_answers[lobby_id]['answers']:
            player_answers[lobby_id]['answers'][sid] = {
                'answer_index': -1,
                'is_correct': False,
                'points': 0,
                'response_time': 30
            }
    
    @socketio.on('request_new_round')
    def handle_request_new_round():
        """Solicita nueva ronda"""
        sid = request.sid
        
        if sid not in user_lobbies:
            emit('error', {'message': 'No estás en ningún lobby'})
            return
        
        lobby_id = user_lobbies[sid]
        
        if lobby_id not in lobbies:
            emit('error', {'message': 'Lobby no encontrado'})
            return
        
        lobby = lobbies[lobby_id]
        
        if lobby['host'] != sid:
            emit('error', {'message': 'Solo el host puede iniciar una nueva ronda'})
            return
        
        lobby['status'] = 'waiting_new_round'
        
        for player in lobby['players']:
            if not player['is_host']:
                player['ready'] = False
        
        print(f'Nueva ronda solicitada en lobby {lobby_id}')
        
        emit('waiting_new_round', {
            'lobby': lobby,
            'message': 'Esperando a que todos estén listos'
        }, room=lobby_id)
    
    @socketio.on('ready_for_new_round')
    def handle_ready_for_new_round():
        """Jugador listo para nueva ronda"""
        sid = request.sid
        
        if sid not in user_lobbies:
            emit('error', {'message': 'No estás en ningún lobby'})
            return
        
        lobby_id = user_lobbies[sid]
        lobby = lobbies[lobby_id]
        
        for player in lobby['players']:
            if player['socket_id'] == sid:
                player['ready'] = True
                break

        emit('player_ready_changed', {'lobby': lobby}, room=lobby_id)

        # Ahora TODOS los jugadores (incluido el host) deben estar listos
        all_ready = all(p['ready'] for p in lobby['players'])
        
        if all_ready:
            lobby['status'] = 'playing'

            # Resetear puntuaciones
            for player in lobby['players']:
                player['score'] = 0
                player['active_powers'] = {}

            # ⭐ NUEVO: Resetear todos los poderes para nueva partida
            if lobby_id in game_powers_managers:
                game_powers_managers[lobby_id].reset_all_for_new_game()
            else:
                game_powers_managers[lobby_id] = GamePowersManager()

            # Reiniciar cola y generador continuo
            question_queue[lobby_id] = []
            start_question_generator(lobby_id)

            # Generar primera pregunta de la nueva ronda usando el servicio normal
            print(f'Iniciando nueva ronda en lobby {lobby_id}...')
            first_question = None
            max_attempts = 3
            for attempt in range(1, max_attempts + 1):
                try:
                    print(f'  [new_round] Intento {attempt} de {max_attempts}...')
                    first_question = generate_single_question_sync()
                    if first_question:
                        break
                except Exception as e:
                    print(f'  [new_round] Error: {e}')
                time.sleep(1)

            if not first_question:
                print(f'⚠️ [new_round] Usando pregunta de fallback')
                first_question = {
                    'question': '¿Cuánto es 2 + 2?',
                    'options': ['1', '2', '3', '4'],
                    'correct_answer': 3,
                    'difficulty': 'easy',
                    'category': 'General',
                    'explanation': '2 + 2 = 4'
                }

            active_questions[lobby_id] = {
                'current_question': first_question,
                'question_number': 1
            }

            # Notificar que la nueva ronda comienza
            emit('new_round_started', {
                'lobby': lobby,
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

        # Verificar permisos: normalmente solo el host puede volver al lobby,
        # pero si la partida ya terminó (round_finished) permitimos que
        # cualquier jugador lo ejecute.
        if lobby.get('status') != 'round_finished' and lobby['host'] != sid:
            emit('error', {'message': 'Solo el host puede volver al lobby'})
            return

        # Si el host registrado ya no está entre los jugadores (por ejemplo,
        # se fue antes), promover al jugador que ejecuta la acción como nuevo host.
        socket_ids = [p.get('socket_id') for p in lobby['players']]
        if lobby.get('host') not in socket_ids and sid in socket_ids:
            lobby['host'] = sid
            for player in lobby['players']:
                player['is_host'] = (player.get('socket_id') == sid)

            me = next((p for p in lobby['players'] if p.get('socket_id') == sid), None)
            print(f"[HOST-REASSIGN] back_to_lobby: jugador {me.get('name') if me else sid} ({sid}) es ahora host del lobby {lobby_id}")
        
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

        # Usar siempre los puntos reales del jugador en el lobby
        lobby = lobbies.get(lobby_id)
        if not lobby:
            emit('error', {'message': 'Lobby no encontrado'})
            return

        player = next((p for p in lobby['players'] if p['socket_id'] == sid), None)
        if not player:
            emit('error', {'message': 'Jugador no encontrado en el lobby'})
            return

        current_points = player.get('score', 0)

        # Obtener gestor global del lobby y el gestor individual del jugador
        if lobby_id not in game_powers_managers:
            game_powers_managers[lobby_id] = GamePowersManager()
        player_manager = game_powers_managers[lobby_id].get_or_create_manager(sid)

        # Intentar usar el poder con los puntos reales del jugador
        success, result = player_manager.use_power(power_type, current_points)

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

            # Actualizar puntuación del jugador en el lobby con los nuevos puntos
            player['score'] = max(0, result['new_points'])

            # Registrar el poder como activo para el jugador (se consumirá al responder)
            if 'active_powers' not in player:
                player['active_powers'] = {}
            try:
                player['active_powers'][power_type] = effect
            except Exception:
                pass

            # Payload de resultado común
            response_payload = {
                'success': True,
                'power_type': power_type,
                'new_points': player['score'],
                'cost': result['cost'],
                'effect': effect,
                'socket_id': sid
            }

            # Enviar al cliente que usó el poder
            emit('power_used', response_payload, room=sid)

            # Notificar a otros jugadores (opcional)
            emit('player_used_power', {
                'player_name': next((p['name'] for p in lobbies[lobby_id]['players'] if p['socket_id'] == sid), 'Jugador'),
                'power_type': power_type,
                'effect': result['effect']
            }, room=lobby_id, skip_sid=request.sid)

            # Emitir actualización del lobby para reflejar el nuevo puntaje
            emit('lobby_updated', {
                'lobby': lobby
            }, room=lobby_id)
        else:
            print(f'Error al usar poder: {result.get("error", "Desconocido")}')
            emit('power_error', {
                'error': result.get('error', 'Error al usar poder'),
                'power_type': power_type,
                'socket_id': sid
            }, room=sid)

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
