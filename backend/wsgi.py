"""
WSGI entry point for Render deployment
This file is used by gunicorn to serve the Flask-SocketIO application
"""
import eventlet
eventlet.monkey_patch()

from main import app, socketio

# Expose the application variable that gunicorn expects
# For Flask-SocketIO, we use socketio.WSGIApp
application = socketio.WSGIApp(socketio, app)

