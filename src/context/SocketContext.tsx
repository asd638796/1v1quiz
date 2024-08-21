import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { username } = useAuth();

  useEffect(() => {
    if (username && !socket) {  
      // Only connect if user is authenticated and socket is not already connected
      const newSocket = io('http://localhost:3001', {
        withCredentials: true,
        autoConnect: true,
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [username]);  // Remove socket from the dependencies array

  return (
    <SocketContext.Provider value={{ socket, connect: () => {}, disconnect: () => {} }}>
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
