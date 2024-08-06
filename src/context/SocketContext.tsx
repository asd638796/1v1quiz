import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const [socket, setSocket] = useState<Socket | null>(null);

  const connect = () => {
    
    const newSocket = io('http://localhost:3001', {
      withCredentials: true,
      autoConnect: true,
      reconnection: false,
      
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    newSocket.on('reconnect', (attempt) => {
      console.log('Reconnected to server', attempt);
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      console.log('Reconnection attempt', attempt);
    });

    newSocket.on('reconnect_failed', () => {
      console.log('Reconnection failed');
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    socket?.disconnect();
    
    setSocket(null);
  };

  return (
    <SocketContext.Provider value={{ socket, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
