#!/bin/bash
# Start script for Render deployment
# This script starts the Flask-SocketIO application using gunicorn with eventlet worker

gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT wsgi:application

