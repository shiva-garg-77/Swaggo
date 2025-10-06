import { io } from 'socket.io-client';

// Connect to the Socket.IO server
const socket = io('http://localhost:45799', {
  withCredentials: true,
  transports: ['polling', 'websocket']
});

socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
  // Disconnect after 5 seconds
  setTimeout(() => {
    socket.disconnect();
    console.log('Disconnected from Socket.IO server');
  }, 5000);
});

socket.on('connect_error', (error) => {
  console.log('Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Keep the process running
setTimeout(() => {
  console.log('Test completed');
  process.exit(0);
}, 10000);