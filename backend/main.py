import os
from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
import uuid

# Carga las variables de .env
load_dotenv()

# Tomamos las variables
mongo_uri = os.getenv("MONGODB_URI")
jwt_secret = os.getenv("JWT_SECRET")

# Conectamos con MongoDB
client = MongoClient(mongo_uri)
db = client['nombre_de_tu_base']

# Inicializar Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = jwt_secret or 'dev-secret-key'
CORS(app, resources={r"/*": {"origins": "*"}})

# Registrar blueprint de autenticación
from auth import auth_bp
app.register_blueprint(auth_bp, url_prefix='/auth')

# Inicializar Socket.IO con eventlet
socketio = SocketIO(app, 
                   cors_allowed_origins="*", 
                   async_mode='eventlet',
                   logger=True,
                   engineio_logger=True)

# Importar y registrar eventos de Socket.IO
from sockets import register_socket_events
register_socket_events(socketio)

print("Servidor iniciado correctamente")

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
