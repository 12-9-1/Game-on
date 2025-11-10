from flask_socketio import emit, join_room, leave_room
from flask import request
import uuid
from datetime import datetime

# Almacenamiento en memoria para lobbies
lobbies = {}
# Mapeo de socket_id a lobby_id
user_lobbies = {}

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
        max_players = data.get('max_players', 4)
        
        # Crear nuevo lobby
        lobbies[lobby_id] = {
            'id': lobby_id,
            'host': sid,
            'players': [{
                'socket_id': sid,
                'name': player_name,
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
        
        # Notificar a todos que el juego comienza
        emit('game_started', {
            'lobby': lobby,
            'message': '¡El juego está comenzando!'
        }, room=lobby_id)