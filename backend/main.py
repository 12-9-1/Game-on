import os
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
import uuid

# Load environment variables
load_dotenv()

# Get environment variables
mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
jwt_secret = os.getenv("JWT_SECRET", "dev-secret-key")

# Connect to MongoDB
client = MongoClient(mongo_uri)
db = client['game_on_db']

# Initialize Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = jwt_secret

# Configure CORS with specific options
# Allow development frontends (Vite) on common ports. Expand origins so Socket.IO handshakes
# and XHR requests from either port succeed during local development.
CORS(app,
     resources={
         r"/*": {
             "origins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True
         }
     })

# Initialize Socket.IO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Import and register socket events
from sockets import register_socket_events
register_socket_events(socketio)

# Import and initialize auth routes
def register_auth_routes():
    from auth import register, login, init_auth
    
    # Initialize auth with app and db
    init_auth(app, db)
    
    # Register auth routes
    app.add_url_rule('/register', 'register', register, methods=['POST'])
    app.add_url_rule('/login', 'login', login, methods=['POST'])
    
    # Test protected route
    @app.route('/protected', methods=['GET'])
    def protected_route():
        from auth import token_required
        
        @token_required
        def protected(current_user):
            return jsonify({'message': f'Hello {current_user["name"]}! This is a protected route.'})
            
        return protected()

# Register auth routes after app is created
register_auth_routes()

print("Server started successfully")

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
