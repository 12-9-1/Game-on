from flask import request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import uuid
from functools import wraps

# Initialize app and db
app = None
db = None

def init_auth(app_instance, db_instance):
    global app, db
    app = app_instance
    db = db_instance

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = db.users.find_one({'public_id': data['public_id']})
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401

        return f(current_user, *args, **kwargs)
    return decorated

def register():
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'message': 'Missing required fields'}), 400
        
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    
    # Check if user already exists
    if db.users.find_one({'email': data['email']}):
        return jsonify({'message': 'User already exists!'}), 400
        
    # Create new user
    user = {
        'public_id': str(uuid.uuid4()),
        'name': data['name'],
        'email': data['email'],
        'password': hashed_password,
        'created_at': datetime.datetime.utcnow()
    }
    
    db.users.insert_one(user)
    
    # Generate token for immediate login
    token = jwt.encode(
        {'public_id': user['public_id'], 'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)},
        current_app.config['SECRET_KEY']
    )
    
    return jsonify({
        'message': 'User registered successfully!',
        'token': token,
        'user': {
            'public_id': user['public_id'],
            'name': user['name'],
            'email': user['email']
        }
    }), 201

def login():
    auth = request.get_json()
    
    if not auth or not auth.get('email') or not auth.get('password'):
        return jsonify({'message': 'Email and password are required!'}), 400
    
    user = db.users.find_one({'email': auth['email']})
    
    if not user or not check_password_hash(user['password'], auth['password']):
        return jsonify({'message': 'Invalid email or password!'}), 401
    
    token = jwt.encode(
        {'public_id': user['public_id'], 'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)},
        current_app.config['SECRET_KEY']
    )
    
    return jsonify({
        'token': token,
        'user': {
            'public_id': user['public_id'],
            'name': user['name'],
            'email': user['email']
        }
    }), 200