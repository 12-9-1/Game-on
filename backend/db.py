import os
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv

load_dotenv()

_mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
_db_name = os.getenv("MONGODB_DB", "game_on")

_client = MongoClient(_mongo_uri)
_db = _client[_db_name]

# Ensure unique index on users.email
try:
    _db["users"].create_index([("email", ASCENDING)], unique=True)
except Exception:
    pass


def get_db():
    return _db

