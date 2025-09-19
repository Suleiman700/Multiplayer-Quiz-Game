import { Room, Player, GameSettings, Question, DBQuestion } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query } from './db-config';

// In-memory storage for active rooms
export const rooms: Map<string, Room> = new Map();

// Default game settings
const DEFAULT_SETTINGS: GameSettings = {
  category: ['general'],
  numQuestions: 10,
  timePerQuestionSec: 15,
  shuffleAnswers: true,
  scoring: 'base',
};

export class RoomManager {
  private static instance: RoomManager;
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Start cleanup interval for inactive rooms
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveRooms();
    }, parseInt(process.env.ROOM_CLEANUP_INTERVAL_MS || '300000')); // 5 minutes
  }

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public createRoom(
    roomName: string,
    hostName: string,
    maxPlayers: number = 10,
    password?: string,
    settings?: Partial<GameSettings>
  ): { room: Room; hostToken: string } {
    const roomId = this.generateRoomId();
    const hostToken = uuidv4();
    
    const host: Player = {
      socketId: '', // Will be set when socket connects
      name: hostName,
      score: 0,
      ready: false,
      connected: false,
      lastSeen: Date.now(),
      sessionToken: hostToken,
    };

    const room: Room = {
      roomId,
      hostId: hostToken,
      roomName,
      passwordHash: password ? bcrypt.hashSync(password, 12) : undefined,
      maxPlayers: Math.min(Math.max(maxPlayers, 2), 50), // Clamp between 2-50
      players: [host],
      settings: { ...DEFAULT_SETTINGS, ...settings },
      createdAt: Date.now(),
    };

    rooms.set(roomId, room);
    console.log(`Room created: ${roomId} by ${hostName}`);
    
    return { room, hostToken };
  }

  public joinRoom(
    roomId: string,
    playerName: string,
    password?: string
  ): { room: Room; sessionToken: string } | { error: string } {
    const room = rooms.get(roomId);
    
    if (!room) {
      return { error: 'ROOM_NOT_FOUND' };
    }

    // Check password if required
    if (room.passwordHash && (!password || !bcrypt.compareSync(password, room.passwordHash))) {
      return { error: 'WRONG_PASSWORD' };
    }

    // Check if room is full
    const activePlayers = room.players.filter(p => p.connected || 
      (Date.now() - p.lastSeen) < parseInt(process.env.RECONNECT_TIMEOUT_MS || '30000'));
    
    if (activePlayers.length >= room.maxPlayers) {
      return { error: 'ROOM_FULL' };
    }

    // Check if player name already exists
    const existingPlayer = room.players.find(p => p.name === playerName);
    if (existingPlayer && existingPlayer.connected) {
      return { error: 'NAME_TAKEN' };
    }

    const sessionToken = uuidv4();
    const newPlayer: Player = {
      socketId: '', // Will be set when socket connects
      name: playerName,
      score: 0,
      ready: false,
      connected: false,
      lastSeen: Date.now(),
      sessionToken,
    };

    room.players.push(newPlayer);
    console.log(`Player ${playerName} joined room ${roomId}`);
    
    return { room, sessionToken };
  }

  public getRoom(roomId: string): Room | undefined {
    return rooms.get(roomId);
  }

  public updatePlayerSocket(roomId: string, sessionToken: string, socketId: string): Player | null {
    const room = rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.sessionToken === sessionToken);
    if (!player) return null;

    player.socketId = socketId;
    player.connected = true;
    player.lastSeen = Date.now();
    
    return player;
  }

  public disconnectPlayer(roomId: string, socketId: string): void {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socketId);
    if (!player) return;

    player.connected = false;
    player.lastSeen = Date.now();
    
    console.log(`Player ${player.name} disconnected from room ${roomId}`);
  }

  public removePlayer(roomId: string, socketId: string): boolean {
    const room = rooms.get(roomId);
    if (!room) return false;

    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) return false;

    const removedPlayer = room.players[playerIndex];
    room.players.splice(playerIndex, 1);
    
    // If host left, assign new host
    if (room.hostId === removedPlayer.sessionToken && room.players.length > 0) {
      room.hostId = room.players[0].sessionToken!;
    }

    // If no players left, remove room
    if (room.players.length === 0) {
      rooms.delete(roomId);
    }

    console.log(`Player ${removedPlayer.name} removed from room ${roomId}`);
    return true;
  }

  public updateSettings(roomId: string, hostToken: string, settings: Partial<GameSettings>): boolean {
    const room = rooms.get(roomId);
    if (!room || room.hostId !== hostToken) return false;

    room.settings = { ...room.settings, ...settings };
    return true;
  }

  public setPlayerReady(roomId: string, socketId: string, ready: boolean): boolean {
    const room = rooms.get(roomId);
    if (!room) return false;

    const player = room.players.find(p => p.socketId === socketId);
    if (!player) return false;

    player.ready = ready;
    return true;
  }

  public setPlayerAvatar(roomId: string, socketId: string, avatar: string): boolean {
    const room = rooms.get(roomId);
    if (!room) return false;

    const player = room.players.find(p => p.socketId === socketId);
    if (!player) return false;

    player.avatar = avatar;
    return true;
  }

  public canStartGame(roomId: string): boolean {
    const room = rooms.get(roomId);
    if (!room) return false;

    const connectedPlayers = room.players.filter(p => p.connected);
    if (connectedPlayers.length === 1) {
      // Allow solo play without requiring ready state
      return true;
    }
    return connectedPlayers.length >= 2 && connectedPlayers.every(p => p.ready);
  }

  public async loadQuestions(categories: string[], numQuestions: number): Promise<Question[]> {
    try {
      const categoryPlaceholders = categories.map(() => '?').join(',');
      const dbQuestions = await query<DBQuestion>(
        `SELECT * FROM questions WHERE category IN (${categoryPlaceholders}) ORDER BY RAND() LIMIT ?`,
        [...categories, numQuestions]
      );

      return dbQuestions.map(q => ({
        id: q.id.toString(),
        text: q.question_text,
        choices: [q.choice_a, q.choice_b, q.choice_c, q.choice_d],
        correctIndex: ['A', 'B', 'C', 'D'].indexOf(q.correct_choice),
        category: q.category,
      }));
    } catch (error) {
      console.error('Error loading questions:', error);
      return [];
    }
  }

  public async getQuestionCounts(): Promise<Record<string, number>> {
    try {
      const counts = await query<{category: string, count: number}>(
        'SELECT category, COUNT(*) as count FROM questions GROUP BY category'
      );
      
      const result: Record<string, number> = {};
      counts.forEach(row => {
        result[row.category] = row.count;
      });
      
      return result;
    } catch (error) {
      console.error('Error getting question counts:', error);
      return {};
    }
  }

  public shuffleChoices(question: Question): Question {
    const shuffledChoices = [...question.choices];
    const correctAnswer = shuffledChoices[question.correctIndex];
    
    // Fisher-Yates shuffle
    for (let i = shuffledChoices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledChoices[i], shuffledChoices[j]] = [shuffledChoices[j], shuffledChoices[i]];
    }
    
    // Find new correct index
    const newCorrectIndex = shuffledChoices.indexOf(correctAnswer);
    
    return {
      ...question,
      choices: shuffledChoices,
      correctIndex: newCorrectIndex,
    };
  }

  private generateRoomId(): string {
    let roomId: string;
    do {
      roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (rooms.has(roomId));
    return roomId;
  }

  private cleanupInactiveRooms(): void {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [roomId, room] of rooms.entries()) {
      const hasActivePlayers = room.players.some((player: Player) => 
        player.connected || (now - player.lastSeen) < parseInt(process.env.RECONNECT_TIMEOUT_MS || '30000')
      );

      if (!hasActivePlayers && (now - room.createdAt) > inactiveThreshold) {
        rooms.delete(roomId);
        console.log(`Cleaned up inactive room: ${roomId}`);
      }
    }
  }

  public get rooms(): Map<string, Room> {
    return rooms;
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
