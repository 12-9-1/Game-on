# backend/main.py
import os
from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()

# Get environment variables
mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
jwt_secret = os.getenv("JWT_SECRET", "dev-secret-key")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Connect to MongoDB
client = MongoClient(mongo_uri)
db = client['game_on_db']

# Initialize Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = jwt_secret

# Configure CORS (unificado y seguro)
CORS(app, resources={r"/*": {
    "origins": [FRONTEND_URL, "http://localhost:5173"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True
}})

# Initialize Socket.IO
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='eventlet',
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25,
    max_http_buffer_size=1e8,  # 100MB max size for messages
    http_compression=True,
    allow_upgrades=True,
    transports=['websocket', 'polling']
)

# Import and register socket events
from sockets import register_socket_events
register_socket_events(socketio)

# Import and initialize auth routes
def register_auth_routes():
    from auth import register, login, init_auth, obtener_usuarios
    
    # Initialize auth with app and db
    init_auth(app, db)
    
    # Register auth routes
    app.add_url_rule('/register', 'register', register, methods=['POST'])
    app.add_url_rule('/login', 'login', login, methods=['POST'])
    app.add_url_rule('/obtenerUsuarios', 'obtener_usuarios', obtener_usuarios, methods=['GET'])
    
    # Test protected route
    @app.route('/protected', methods=['GET'])
    def protected_route():
        from auth import token_required
        
        @token_required
        def protected(current_user):
            return jsonify({'message': f'Hello {current_user["name"]}! This is a protected route.'})
            
        return protected()

# Register auth routes
register_auth_routes()

# Root route for health check
@app.route("/")
def index():
    return "Servidor Game-On funcionando 🚀"

print("Server started successfully")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(
        app,
        host='0.0.0.0',
        port=port,
        debug=False,
        allow_unsafe_werkzeug=True
    )
