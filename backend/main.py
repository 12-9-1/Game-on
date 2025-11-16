import os
from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient

# Try to select an async mode that supports WebSocket upgrades in production
# Prefer eventlet, then gevent, otherwise fallback to threading (less optimal)
async_mode = 'threading'
use_eventlet = False
use_gevent = False
try:
    import eventlet
    eventlet.monkey_patch()
    async_mode = 'eventlet'
    use_eventlet = True
except Exception:
    try:
        from gevent import monkey
        monkey.patch_all()
        async_mode = 'gevent'
        use_gevent = True
    except Exception:
        async_mode = 'threading'

# Load environment variables
load_dotenv()

# Environment
mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
jwt_secret = os.getenv("JWT_SECRET", "dev-secret-key")
FRONTEND_URL = os.getenv("URL_FRONTEND", "http://localhost:5173")

# Connect DB
client = MongoClient(mongo_uri)
db = client['game_on_db']

# Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = jwt_secret

# Allowed origins
# Always include common localhost dev origins so frontend running on Vite can talk to backend locally.
allowed_origins = [
    FRONTEND_URL,
]

# In development, you can allow all origins by setting the environment variable
# ALLOW_ALL_CORS=1 (useful for quick local testing). Otherwise use the explicit list above.
if os.getenv('ALLOW_ALL_CORS', '').lower() in ('1', 'true', 'yes'):
    allowed_origins = ['*']

print('Allowed CORS origins:', allowed_origins)

# CORS
CORS(app, origins=allowed_origins, supports_credentials=True)

# Socket.IO
# When cors_allowed_origins is '*', python-socketio will allow all origins.
# Use the detected async_mode (eventlet, gevent, or threading)
socketio = SocketIO(app, cors_allowed_origins=allowed_origins, async_mode=async_mode)

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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
