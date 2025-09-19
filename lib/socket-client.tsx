'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room, Player, ErrorResponse } from '@/types/game';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  room: Room | null;
  player: Player | null;
  sessionToken: string | null;
  error: string | null;
  connecting: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  room: null,
  player: null,
  sessionToken: null,
  error: null,
  connecting: false,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);
    setConnecting(true);

    // Migrate any legacy localStorage tokens to sessionStorage for per-tab isolation
    const legacyToken = localStorage.getItem('quiz_session_token');
    const legacyRoomId = localStorage.getItem('quiz_room_id');
    if (legacyToken) {
      sessionStorage.setItem('quiz_session_token', legacyToken);
      localStorage.removeItem('quiz_session_token');
    }
    if (legacyRoomId) {
      sessionStorage.setItem('quiz_room_id', legacyRoomId);
      localStorage.removeItem('quiz_room_id');
    }

    // Restore session token from sessionStorage
    const savedSessionToken = sessionStorage.getItem('quiz_session_token');
    if (savedSessionToken) {
      setSessionToken(savedSessionToken);
    }

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      setConnecting(false);
      setError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setConnected(false);
      setConnecting(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
      setConnecting(false);
      setError('Failed to connect to server');
    });

    // Room event handlers
    newSocket.on('room_created', (data) => {
      setRoom(data.roomState);
      setSessionToken(data.hostToken);
      // Save session token to sessionStorage for per-tab persistence
      sessionStorage.setItem('quiz_session_token', data.hostToken);
      sessionStorage.setItem('quiz_room_id', data.roomState.roomId);
      const hostPlayer = data.roomState.players.find((p: Player) => p.sessionToken === data.hostToken);
      setPlayer(hostPlayer || null);
      setError(null);
    });

    newSocket.on('joined_room', (data) => {
      setRoom(data.roomState);
      setSessionToken(data.sessionToken);
      // Save session token to sessionStorage for per-tab persistence
      sessionStorage.setItem('quiz_session_token', data.sessionToken);
      sessionStorage.setItem('quiz_room_id', data.roomState.roomId);
      const joinedPlayer = data.roomState.players.find((p: Player) => p.sessionToken === data.sessionToken);
      setPlayer(joinedPlayer || null);
      setError(null);
    });

    newSocket.on('player_joined', (data) => {
      setRoom(data.roomState);
      const storedToken = sessionStorage.getItem('quiz_session_token');
      const tokenToUse = sessionToken || storedToken;
      if (tokenToUse) {
        const updatedPlayer = data.roomState.players.find((p: Player) => p.sessionToken === tokenToUse);
        if (updatedPlayer) setPlayer(updatedPlayer);
      }
    });

    newSocket.on('player_left', (data) => {
      // Functional update to avoid stale room reference
      setRoom((prev) => {
        if (!prev) return prev;
        return { ...prev, players: prev.players.filter((p: Player) => p.socketId !== data.socketId) };
      });
    });

    newSocket.on('player_updated', (data) => {
      console.log('Received player_updated event:', data);
      setRoom(data.roomState);
      // Use sessionToken or stored token to identify the current player reliably
      const storedToken = sessionStorage.getItem('quiz_session_token');
      const tokenToUse = sessionToken || storedToken;
      if (tokenToUse) {
        const updatedPlayer = data.roomState.players.find((p: Player) => p.sessionToken === tokenToUse);
        if (updatedPlayer) {
          console.log('Updating current player by token:', updatedPlayer);
          setPlayer(updatedPlayer);
        }
      }
    });

    newSocket.on('room_updated', (data) => {
      console.log('Received room_updated event with new scores:', data);
      setRoom(data.roomState);
      // Identify current player using token from context or storage (avoid stale closure)
      const storedToken = sessionStorage.getItem('quiz_session_token');
      const tokenToUse = sessionToken || storedToken;
      if (tokenToUse) {
        const updatedPlayer = data.roomState.players.find((p: Player) => p.sessionToken === tokenToUse);
        if (updatedPlayer) {
          setPlayer(updatedPlayer);
        }
      }
    });

    // Update room when a player disconnects (mark as not connected)
    newSocket.on('player_disconnected', (data: { player: Player }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p: Player) =>
            p.socketId === data.player.socketId ? { ...p, connected: false, lastSeen: Date.now() } : p
          ),
        };
      });
    });

    newSocket.on('settings_updated', (data) => {
      setRoom((prev) => (prev ? { ...prev, settings: data.settings } : prev));
    });

    newSocket.on('reconnected_room', (data) => {
      console.log('Received reconnected_room event:', data);
      setRoom(data.roomState);
      
      // Use stored session token if context sessionToken is not available yet
      const storedToken = sessionStorage.getItem('quiz_session_token');
      const tokenToUse = sessionToken || storedToken;
      
      const reconnectedPlayer = data.roomState.players.find((p: Player) => p.sessionToken === tokenToUse);
      console.log('Looking for player with token:', tokenToUse, 'Found:', reconnectedPlayer);
      
      setPlayer(reconnectedPlayer || null);
      
      // Set the session token in context if it wasn't set
      if (!sessionToken && storedToken) {
        setSessionToken(storedToken);
      }
      
      setError(null);
    });

    newSocket.on('host_changed', (data) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const newHost = prev.players.find((p: Player) => p.socketId === data.newHostId);
        return newHost ? { ...prev, hostId: newHost.sessionToken! } : prev;
      });
    });

    // Error handlers
    newSocket.on('error', (data: ErrorResponse) => {
      setError(data.message);
    });

    newSocket.on('join_error', (data: ErrorResponse) => {
      setError(data.message);
    });

    newSocket.on('start_failed', (data: ErrorResponse) => {
      setError(data.message);
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Auto-reconnect logic
  useEffect(() => {
    if (!connected && sessionToken && room && socket) {
      const reconnectTimer = setTimeout(() => {
        console.log('Attempting to reconnect...');
        socket.emit('reconnect_room', {
          roomId: room.roomId,
          sessionToken: sessionToken,
        });
      }, 2000);

      return () => clearTimeout(reconnectTimer);
    }
  }, [connected, sessionToken, room, socket]);

  // Store session token in sessionStorage
  useEffect(() => {
    if (sessionToken) {
      sessionStorage.setItem('quiz_session_token', sessionToken);
    }
  }, [sessionToken]);

  // Restore session token from sessionStorage (fallback if context is empty)
  useEffect(() => {
    const storedToken = sessionStorage.getItem('quiz_session_token');
    if (storedToken && !sessionToken) {
      setSessionToken(storedToken);
    }
  }, []);

  const value: SocketContextType = {
    socket,
    connected,
    room,
    player,
    sessionToken,
    error,
    connecting,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
