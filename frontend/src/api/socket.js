import { io } from 'socket.io-client'

let socket

export const getSocket = (token) => {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_BASE || 'http://localhost:5000', {
      auth: { token },
    })
  }
  return socket
}
