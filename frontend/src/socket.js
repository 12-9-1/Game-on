// frontend/src/socket.js
import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  autoConnect: true,
  forceNew: true,
  withCredentials: true
});