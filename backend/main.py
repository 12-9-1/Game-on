import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Carga las variables de .env
load_dotenv()

# Tomamos las variables
mongo_uri = os.getenv("MONGODB_URI")
jwt_secret = os.getenv("JWT_SECRET")

# Conectamos con MongoDB
client = MongoClient(mongo_uri)
db = client['nombre_de_tu_base']

print("Conexión a la base de datos exitosa")
