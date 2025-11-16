"""
WSGI entry point for Render deployment
This file is used by gunicorn to serve the Flask-SocketIO application
"""
import eventlet
eventlet.monkey_patch()

from main import app

# Expose the application variable that gunicorn expects
# For Flask-SocketIO with gunicorn, we use the Flask app directly
# SocketIO is already integrated with the app, and eventlet worker handles WebSockets
application = app

