import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { RoomManager } from './room-manager';
import { GameLogic } from './game-logic';
import {
  CreateRoomData,
  JoinRoomData,
  AnswerData,
  UpdateSettingsData,
  RoomCreatedResponse,
  JoinedRoomResponse,
  ErrorResponse,
} from '@/types/game';

export class SocketServer {
  private io: SocketIOServer;
  private roomManager: RoomManager;
  private gameLogic: GameLogic;
  private questionTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://your-domain.com'] 
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
      },
    });

    this.roomManager = RoomManager.getInstance();
    this.gameLogic = new GameLogic();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Room Management Events
      socket.on('create_room', async (data: CreateRoomData) => {
        try {
          const { room, hostToken } = this.roomManager.createRoom(
            data.roomName,
            data.hostName,
            data.maxPlayers,
            data.password,
            data.settings
          );

          // Update host socket ID
          this.roomManager.updatePlayerSocket(room.roomId, hostToken, socket.id);
          
          // Join socket to room
          await socket.join(room.roomId);

          const response: RoomCreatedResponse = {
            roomId: room.roomId,
            hostToken,
            roomState: room,
          };

          socket.emit('room_created', response);
          console.log(`Room created: ${room.roomId} by ${data.hostName}`);
        } catch (error) {
          console.error('Error creating room:', error);
          socket.emit('error', { code: 'CREATE_ROOM_FAILED', message: 'Failed to create room' });
        }
      });

      // Update avatar
      socket.on('update_avatar', (data: { roomId: string; avatar: string }) => {
        try {
          const success = this.roomManager.setPlayerAvatar(data.roomId, socket.id, data.avatar);
          if (!success) {
            socket.emit('error', { code: 'UPDATE_AVATAR_FAILED', message: 'Failed to update avatar' });
            return;
          }

          const room = this.roomManager.getRoom(data.roomId);
          if (room) {
            const player = room.players.find(p => p.socketId === socket.id);
            this.io.to(data.roomId).emit('player_updated', { player, roomState: room });
          }
        } catch (error) {
          console.error('Error updating avatar:', error);
          socket.emit('error', { code: 'UPDATE_AVATAR_FAILED', message: 'Failed to update avatar' });
        }
      });

      socket.on('join_room', async (data: JoinRoomData) => {
        try {
          const result = this.roomManager.joinRoom(data.roomId, data.name, data.password);
          
          if ('error' in result) {
            socket.emit('join_error', { code: result.error, message: this.getErrorMessage(result.error) });
            return;
          }

          const { room, sessionToken } = result;
          
          // Update player socket ID
          this.roomManager.updatePlayerSocket(room.roomId, sessionToken, socket.id);
          
          // Join socket to room
          await socket.join(room.roomId);

          const response: JoinedRoomResponse = {
            roomState: room,
            sessionToken,
          };

          socket.emit('joined_room', response);
          socket.to(room.roomId).emit('player_joined', {
            player: room.players.find(p => p.sessionToken === sessionToken),
            roomState: room,
          });

          console.log(`Player ${data.name} joined room ${data.roomId}`);
        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('error', { code: 'JOIN_ROOM_FAILED', message: 'Failed to join room' });
        }
      });

      socket.on('reconnect_room', async (data: { roomId: string; sessionToken: string }) => {
        try {
          const player = this.roomManager.updatePlayerSocket(data.roomId, data.sessionToken, socket.id);
          if (!player) {
            socket.emit('error', { code: 'RECONNECT_FAILED', message: 'Invalid session token' });
            return;
          }

          const room = this.roomManager.getRoom(data.roomId);
          if (!room) {
            socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            return;
          }

          await socket.join(data.roomId);
          socket.emit('reconnected_room', { roomState: room });
          socket.to(data.roomId).emit('player_reconnected', { player });

          console.log(`Player ${player.name} reconnected to room ${data.roomId}`);
        } catch (error) {
          console.error('Error reconnecting:', error);
          socket.emit('error', { code: 'RECONNECT_FAILED', message: 'Failed to reconnect' });
        }
      });

      socket.on('set_ready', (data: { roomId: string; ready: boolean }) => {
        try {
          console.log(`Setting ready status for socket ${socket.id} in room ${data.roomId} to ${data.ready}`);
          const success = this.roomManager.setPlayerReady(data.roomId, socket.id, data.ready);
          if (!success) {
            console.log(`Failed to set ready status for socket ${socket.id}`);
            socket.emit('error', { code: 'SET_READY_FAILED', message: 'Failed to set ready status' });
            return;
          }

          const room = this.roomManager.getRoom(data.roomId);
          if (room) {
            const player = room.players.find(p => p.socketId === socket.id);
            console.log(`Player found:`, player);
            console.log(`Emitting player_updated to room ${data.roomId}`);
            this.io.to(data.roomId).emit('player_updated', { player, roomState: room });
          }
        } catch (error) {
          console.error('Error setting ready status:', error);
          socket.emit('error', { code: 'SET_READY_FAILED', message: 'Failed to set ready status' });
        }
      });

      socket.on('update_settings', (data: UpdateSettingsData) => {
        try {
          const room = this.roomManager.getRoom(data.roomId);
          if (!room) {
            socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            return;
          }

          const player = room.players.find(p => p.socketId === socket.id);
          if (!player || room.hostId !== player.sessionToken) {
            socket.emit('error', { code: 'NOT_HOST', message: 'Only host can update settings' });
            return;
          }

          const success = this.roomManager.updateSettings(data.roomId, player.sessionToken!, data.settings);
          if (!success) {
            socket.emit('error', { code: 'UPDATE_SETTINGS_FAILED', message: 'Failed to update settings' });
            return;
          }

          this.io.to(data.roomId).emit('settings_updated', { settings: room.settings });
        } catch (error) {
          console.error('Error updating settings:', error);
          socket.emit('error', { code: 'UPDATE_SETTINGS_FAILED', message: 'Failed to update settings' });
        }
      });

      // Utility Events
      socket.on('get_question_counts', async () => {
        try {
          const questionCounts = await this.roomManager.getQuestionCounts();
          socket.emit('question_counts', questionCounts);
        } catch (error) {
          console.error('Error getting question counts:', error);
          socket.emit('error', { code: 'GET_COUNTS_FAILED', message: 'Failed to get question counts' });
        }
      });

      // Game Events
      socket.on('start_game', async (data: { roomId: string }) => {
        try {
          const room = this.roomManager.getRoom(data.roomId);
          if (!room) {
            socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            return;
          }

          const player = room.players.find(p => p.socketId === socket.id);
          if (!player || room.hostId !== player.sessionToken) {
            socket.emit('error', { code: 'NOT_HOST', message: 'Only host can start game' });
            return;
          }

          const result = await this.gameLogic.startGame(data.roomId);
          if (!result.success) {
            socket.emit('start_failed', { code: result.error, message: this.getErrorMessage(result.error!) });
            return;
          }

          // Notify all players that game started
          this.io.to(data.roomId).emit('game_started', {
            questionsCount: room.game!.questions.length,
            timePerQuestion: room.settings.timePerQuestionSec,
          });

          // Start first question
          this.startQuestion(data.roomId);
        } catch (error) {
          console.error('Error starting game:', error);
          socket.emit('error', { code: 'START_GAME_FAILED', message: 'Failed to start game' });
        }
      });

      socket.on('answer', (data: AnswerData) => {
        try {
          const result = this.gameLogic.submitAnswer(
            data.roomId,
            socket.id,
            data.questionIndex,
            data.choiceIndex,
            data.timestamp
          );

          if (!result.success) {
            socket.emit('answer_error', { code: result.error, message: this.getErrorMessage(result.error!) });
            return;
          }

          // Notify room that this player has answered (for UI checkmarks)
          this.io.to(data.roomId).emit('player_answered', {
            socketId: socket.id,
            questionIndex: data.questionIndex,
          });

          // Send result to the answering player
          socket.emit('answer_received', {
            questionIndex: data.questionIndex,
            ...result.result,
          });

          // Broadcast updated room state with new scores to all players
          const room = this.roomManager.getRoom(data.roomId);
          if (room) {
            this.io.to(data.roomId).emit('room_updated', { roomState: room });
          }

          // Check if all players have answered
          if (this.gameLogic.checkAllPlayersAnswered(data.roomId)) {
            this.endQuestion(data.roomId);
          }
        } catch (error) {
          console.error('Error processing answer:', error);
          socket.emit('error', { code: 'ANSWER_FAILED', message: 'Failed to process answer' });
        }
      });

      socket.on('leave_room', (data: { roomId: string }) => {
        this.handlePlayerLeave(socket.id, data.roomId);
      });

      socket.on('heartbeat', (data: { roomId: string }) => {
        const room = this.roomManager.getRoom(data.roomId);
        if (room) {
          const player = room.players.find(p => p.socketId === socket.id);
          if (player) {
            player.lastSeen = Date.now();
          }
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
        this.handlePlayerDisconnect(socket.id);
      });
    });
  }

  private startQuestion(roomId: string): void {
    const questionData = this.gameLogic.getCurrentQuestion(roomId);
    if (!questionData) return;

    // Start question timer
    this.gameLogic.startQuestionTimer(roomId);

    // Send question to all players
    this.io.to(roomId).emit('new_question', questionData);

    // Set timer for automatic question end
    const room = this.roomManager.getRoom(roomId);
    if (room) {
      const timer = setTimeout(() => {
        this.endQuestion(roomId);
      }, room.settings.timePerQuestionSec * 1000);

      this.questionTimers.set(roomId, timer);

      // Send timer ticks (optional - for better UX)
      this.startTimerTicks(roomId, room.settings.timePerQuestionSec);
    }
  }

  private startTimerTicks(roomId: string, totalSeconds: number): void {
    let remainingTime = totalSeconds;
    
    const tickInterval = setInterval(() => {
      remainingTime--;
      this.io.to(roomId).emit('timer_tick', {
        timeLeft: remainingTime,
        totalTime: totalSeconds,
      });

      if (remainingTime <= 0) {
        clearInterval(tickInterval);
      }
    }, 1000);
  }

  private endQuestion(roomId: string): void {
    // Clear question timer
    const timer = this.questionTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.questionTimers.delete(roomId);
    }

    // Get round results
    const roundResults = this.gameLogic.getRoundResults(roomId);
    if (!roundResults) return;

    // Send results to all players
    this.io.to(roomId).emit('round_results', roundResults);

    // Wait a bit before next question or ending game
    setTimeout(() => {
      const hasNextQuestion = this.gameLogic.advanceToNextQuestion(roomId);
      
      if (hasNextQuestion) {
        this.startQuestion(roomId);
      } else {
        this.endGame(roomId);
      }
    }, 3000); // 3 second delay between questions
  }

  private async endGame(roomId: string): Promise<void> {
    const gameResults = await this.gameLogic.endGame(roomId);
    if (!gameResults) return;

    this.io.to(roomId).emit('game_over', gameResults);
    console.log(`Game ended in room ${roomId}`);
  }

  private handlePlayerDisconnect(socketId: string): void {
    // Find which room the player was in
    for (const [roomId, room] of this.roomManager.rooms.entries()) {
      const player = room.players.find((p: any) => p.socketId === socketId);
      if (player) {
        this.roomManager.disconnectPlayer(roomId, socketId);
        this.io.to(roomId).emit('player_disconnected', { player });
        break;
      }
    }
  }

  private handlePlayerLeave(socketId: string, roomId: string): void {
    const removed = this.roomManager.removePlayer(roomId, socketId);
    if (removed) {
      this.io.to(roomId).emit('player_left', { socketId });
      
      // Check if host changed
      const room = this.roomManager.getRoom(roomId);
      if (room && room.players.length > 0) {
        const newHost = room.players.find(p => p.sessionToken === room.hostId);
        if (newHost) {
          this.io.to(roomId).emit('host_changed', { newHostId: newHost.socketId });
        }
      }
    }
  }

  private getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      ROOM_NOT_FOUND: 'Room not found',
      WRONG_PASSWORD: 'Incorrect password',
      ROOM_FULL: 'Room is full',
      NAME_TAKEN: 'Name is already taken',
      NOT_ENOUGH_PLAYERS: 'Not enough players to start game',
      NO_QUESTIONS_AVAILABLE: 'No questions available for selected categories',
      GAME_NOT_FOUND: 'Game not found',
      PLAYER_NOT_FOUND: 'Player not found',
      GAME_NOT_RUNNING: 'Game is not running',
      INVALID_QUESTION_INDEX: 'Invalid question index',
      ALREADY_ANSWERED: 'You have already answered this question',
      INVALID_CHOICE: 'Invalid choice',
      TIME_EXPIRED: 'Time has expired for this question',
      NOT_HOST: 'Only the host can perform this action',
    };

    return messages[code] || 'An unknown error occurred';
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}
