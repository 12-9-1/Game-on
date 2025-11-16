# backend/main.py
import os
from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()

# Environment
mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
jwt_secret = os.getenv("JWT_SECRET", "dev-secret-key")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Connect DB
client = MongoClient(mongo_uri)
db = client['game_on_db']

# Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = jwt_secret

# Allowed origins
allowed_origins = [
    FRONTEND_URL,
    "http://localhost:5173",
    "https://game-on.vercel.app",
    "https://game-on-lias-projects.vercel.app",
    "https://game-on-8nge.onrender.com"
]

# CORS
CORS(app, origins=allowed_origins, supports_credentials=True)

# Socket.IO (🚀 SIN eventlet – modo threading)
socketio = SocketIO(
    app,
    cors_allowed_origins=allowed_origins,
    async_mode='threading',  # ← ✔️ ESTO FUNCIONA EN RENDER
    manage_session=False
)

# Import sockets
from sockets import register_socket_events
register_socket_events(socketio)

# Auth routes
def register_auth_routes():
    from auth import register, login, init_auth, obtener_usuarios

    init_auth(app, db)

    app.add_url_rule('/register', 'register', register, methods=['POST'])
    app.add_url_rule('/login', 'login', login, methods=['POST'])
    app.add_url_rule('/obtenerUsuarios', 'obtener_usuarios', obtener_usuarios, methods=['GET'])

register_auth_routes()

@app.route("/")
def index():
    return "Servidor Game-On funcionando 🚀"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port)
