"""
WSGI entry point for Render deployment
This file is used by gunicorn to serve the Flask-SocketIO application
"""
# CRITICAL: Monkey patch MUST be the very first thing, before ANY other imports
import eventlet
eventlet.monkey_patch()

# Now we can import main, which will handle the rest
from main import app

# Expose the application variable that gunicorn expects
# For Flask-SocketIO with gunicorn, we use the Flask app directly
# SocketIO is already integrated with the app, and eventlet worker handles WebSockets
application = app

