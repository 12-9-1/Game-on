#!/usr/bin/env python
"""
Script de prueba manual end-to-end para los poderes del juego.
Simula dos jugadores, crea un lobby, inicia juego y prueba cada poder.
"""
import socketio
import time
import json

class GameTester:
    def __init__(self):
        self.sio = socketio.Client()
        self.lobby_id = None
        self.setup_handlers()
    
    def setup_handlers(self):
        @self.sio.event
        def connect():
            print('\n[✓] Cliente conectado al servidor Socket.IO')
        
        @self.sio.event
        def connected(data):
            print(f'[SERVER] {data.get("message", "")}')
        
        @self.sio.event
        def lobby_created(data):
            self.lobby_id = data['lobby']['id']
            print(f'\n[LOBBY CREATED]')
            print(f'  ID: {self.lobby_id}')
            print(f'  Players: {[p["name"] for p in data["lobby"]["players"]]}')
        
        @self.sio.event
        def lobby_joined(data):
            print(f'\n[LOBBY JOINED]')
            print(f'  Players: {[p["name"] for p in data["lobby"]["players"]]}')
        
        @self.sio.event
        def player_ready_changed(data):
            players = data['lobby']['players']
            ready_str = ", ".join([f'{p["name"]}={p["ready"]}' for p in players])
            print(f'[READY STATE] {ready_str}')
        
        @self.sio.event
        def game_started(data):
            print(f'\n[GAME STARTED]')
            print(f'  Message: {data.get("message", "")}')
        
        @self.sio.event
        def new_question(data):
            print(f'\n[NEW QUESTION] #{data.get("question_number")}')
            print(f'  Q: {data.get("question", "?")[:80]}...')
            print(f'  Options: {data.get("options", [])}')
            print(f'  Powers available: {json.dumps(data.get("powers", []), indent=4)}')
        
        @self.sio.event
        def power_used(data):
            print(f'\n[POWER USED SUCCESS]')
            print(f'  Type: {data.get("power_type")}')
            print(f'  Cost: {data.get("cost")} pts')
            print(f'  New score: {data.get("new_points")}')
            print(f'  Effect: {data.get("effect")}')
        
        @self.sio.event
        def power_error(data):
            print(f'\n[⚠ POWER ERROR]')
            print(f'  {data.get("error", "")}')
        
        @self.sio.event
        def answer_result(data):
            print(f'\n[ANSWER RESULT]')
            print(f'  Correct: {data.get("is_correct")}')
            print(f'  Points gained: {data.get("points")}')
            print(f'  Total score: {data.get("total_score")}')
            print(f'  Correct answer was: {data.get("correct_answer")}')
        
        @self.sio.event
        def lobby_updated(data):
            players = data.get('lobby', {}).get('players', [])
            scores = [(p['name'], p.get('score', 0)) for p in players]
            print(f'[LOBBY UPDATE] Scores: {scores}')
        
        @self.sio.event
        def error(data):
            print(f'\n[❌ ERROR] {data.get("message", "")}')
        
        @self.sio.event
        def disconnect():
            print('\n[CLIENT] Desconectado')
    
    def run_test(self):
        try:
            print("=" * 70)
            print("PRUEBA DE PODERES - END TO END")
            print("=" * 70)
            
            # Conectar
            print("\n[1] Conectando al servidor...")
            self.sio.connect('http://localhost:5000', 
                            transports=['websocket', 'polling'])
            time.sleep(1)
            
            # Jugador 1: Crear lobby
            print("\n[2] Jugador 1 creando lobby...")
            self.sio.emit('create_lobby', {
                'player_name': 'TestPlayer1',
                'max_players': 2
            })
            time.sleep(1)
            
            # Jugador 1: Listo
            print("\n[3] Jugador 1 marcándose como listo...")
            self.sio.emit('toggle_ready')
            time.sleep(0.5)
            
            # Abrir segunda conexión para Jugador 2
            print("\n[4] Conectando Jugador 2...")
            sio2 = socketio.Client()
            sio2.connect('http://localhost:5000')
            time.sleep(0.5)
            
            # Jugador 2: Unirse al lobby
            print(f"\n[5] Jugador 2 uniéndose al lobby {self.lobby_id}...")
            sio2.emit('join_lobby', {
                'lobby_id': self.lobby_id,
                'player_name': 'TestPlayer2'
            })
            time.sleep(1)
            
            # Jugador 2: Listo
            print("\n[6] Jugador 2 marcándose como listo...")
            sio2.emit('toggle_ready')
            time.sleep(1)
            
            # Jugador 1: Iniciar juego
            print("\n[7] Jugador 1 iniciando juego...")
            self.sio.emit('start_game')
            time.sleep(3)  # Esperar preguntas generadas
            
            # Esperar primera pregunta
            print("\n[8] Esperando primera pregunta...")
            time.sleep(2)
            
            # === PRUEBA 1: 50/50 ===
            print("\n" + "=" * 70)
            print("PRUEBA 1: 50/50 Power")
            print("=" * 70)
            print("\n[9] Jugador 1 usando 50/50...")
            self.sio.emit('use_power', {'power_type': 'fifty_fifty'})
            time.sleep(1)
            
            # === PRUEBA 2: Intentar usar 50/50 de nuevo (debe fallar) ===
            print("\n" + "=" * 70)
            print("PRUEBA 2: Intento de reutilizar 50/50 (debe fallar)")
            print("=" * 70)
            print("\n[10] Jugador 1 intentando usar 50/50 nuevamente...")
            self.sio.emit('use_power', {'power_type': 'fifty_fifty'})
            time.sleep(1)
            
            # Responder pregunta
            print("\n[11] Jugador 1 respondiendo (opción 0)...")
            self.sio.emit('submit_answer', {'answer_index': 0})
            time.sleep(1)
            
            # Jugador 2 responde
            print("\n[12] Jugador 2 respondiendo (opción 1)...")
            sio2.emit('submit_answer', {'answer_index': 1})
            time.sleep(2)
            
            # === PRUEBA 3: Double Points ===
            print("\n" + "=" * 70)
            print("PRUEBA 3: Double Points Power")
            print("=" * 70)
            print("\n[13] Jugador 1 usando Double Points...")
            self.sio.emit('use_power', {'power_type': 'double_points'})
            time.sleep(1)
            
            # Responder siguiente pregunta (debe aplicar doble)
            print("\n[14] Jugador 1 respondiendo con Double Points activo...")
            self.sio.emit('submit_answer', {'answer_index': 0})
            time.sleep(1)
            
            print("\n[15] Jugador 2 respondiendo...")
            sio2.emit('submit_answer', {'answer_index': 0})
            time.sleep(2)
            
            # === PRUEBA 4: Time Boost ===
            print("\n" + "=" * 70)
            print("PRUEBA 4: Time Boost Power")
            print("=" * 70)
            print("\n[16] Jugador 2 usando Time Boost...")
            sio2.emit('use_power', {'power_type': 'time_boost'})
            time.sleep(1)
            
            print("\n[✓] PRUEBA COMPLETADA")
            print("\nVerifica que:")
            print("  1. 50/50 ocultó 2 opciones en la UI")
            print("  2. 50/50 cobró 150 pts (100 base + 50% surcharge)")
            print("  3. Al reintentar 50/50, recibiste error 'Este poder ya fue usado'")
            print("  4. Double Points duplicó los puntos de la respuesta correcta")
            print("  5. Double Points costó 450 pts (300 base + 50% surcharge)")
            print("  6. Time Boost costó 75 pts (50 base + 50% surcharge)")
            
            time.sleep(2)
            sio2.disconnect()
            self.sio.disconnect()
            
        except Exception as e:
            print(f"\n[❌ ERROR] {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    tester = GameTester()
    tester.run_test()
