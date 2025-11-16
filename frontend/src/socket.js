// frontend/src/socket.js
import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_URL_BACKEND;

export const socket = io(BACKEND_URL, {
  transports: ['polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  autoConnect: true,
  // forceNew: true, // Removido para evitar crear nuevas conexiones innecesarias
  withCredentials: true
});