import { io, Socket } from "socket.io-client";

let socket: Socket;

export const initSocket = () => {
  if (!socket) {
    socket = io("http://localhost:5000", {
      withCredentials: true,
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) throw new Error("Socket not initialized");
  return socket;
};
