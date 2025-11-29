require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const { registerSocketEvents } = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);

// Configurar Socket.IO con CORS
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(express.json());

// Configurar CORS para Express
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
  credentials: true
}));

// Rutas
app.use('/', authRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Game-On Backend - Node.js' });
});

// Registrar eventos de Socket.IO
registerSocketEvents(io);

// Iniciar servidor
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Conectar a MongoDB
    await connectDB();
    
    server.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`✓ Servidor iniciado en puerto ${PORT}`);
      console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`✓ MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/game_on_db'}`);
      console.log(`${'='.repeat(60)}\n`);
    });
  } catch (error) {
    console.error('Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
