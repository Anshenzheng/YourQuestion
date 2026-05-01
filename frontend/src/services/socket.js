import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect() {
    if (this.socket) {
      return;
    }
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    
    this.socket.on('connect', () => {
      console.log('WebSocket连接成功');
    });
    
    this.socket.on('disconnect', () => {
      console.log('WebSocket连接断开');
    });
    
    this.socket.on('question_created', (question) => {
      this.emit('question_created', question);
    });
    
    this.socket.on('question_updated', (question) => {
      this.emit('question_updated', question);
    });
  }

  joinRoom(roomId) {
    if (this.socket) {
      this.socket.emit('join', { room_id: roomId });
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
