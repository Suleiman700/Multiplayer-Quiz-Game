import { Room, Player, Question, PlayerAnswer, Game } from '@/types/game';
import { RoomManager } from './room-manager';
import { query } from './db-config';

export class GameLogic {
  private roomManager: RoomManager;

  constructor() {
    this.roomManager = RoomManager.getInstance();
  }

  public async startGame(roomId: string): Promise<{ success: boolean; error?: string }> {
    const room = this.roomManager.getRoom(roomId);
    if (!room) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    if (!this.roomManager.canStartGame(roomId)) {
      return { success: false, error: 'NOT_ENOUGH_PLAYERS' };
    }

    // Load questions based on settings
    const questions = await this.roomManager.loadQuestions(
      room.settings.category,
      room.settings.numQuestions
    );

    if (questions.length === 0) {
      return { success: false, error: 'NO_QUESTIONS_AVAILABLE' };
    }

    // Shuffle questions if needed
    const gameQuestions = room.settings.shuffleAnswers 
      ? questions.map(q => this.roomManager.shuffleChoices(q))
      : questions;

    // Initialize game state
    room.game = {
      status: 'running',
      questions: gameQuestions,
      currentQuestionIndex: 0,
      answers: {},
      startTime: Date.now(),
    };

    // Reset player scores and ready status
    room.players.forEach(player => {
      player.score = 0;
      player.ready = false;
    });

    console.log(`Game started in room ${roomId} with ${questions.length} questions`);
    return { success: true };
  }

  public submitAnswer(
    roomId: string,
    socketId: string,
    questionIndex: number,
    choiceIndex: number,
    timestamp: number
  ): { success: boolean; error?: string; result?: any } {
    const room = this.roomManager.getRoom(roomId);
    if (!room || !room.game) {
      return { success: false, error: 'GAME_NOT_FOUND' };
    }

    const player = room.players.find(p => p.socketId === socketId);
    if (!player) {
      return { success: false, error: 'PLAYER_NOT_FOUND' };
    }

    const game = room.game;
    if (game.status !== 'running') {
      return { success: false, error: 'GAME_NOT_RUNNING' };
    }

    if (questionIndex !== game.currentQuestionIndex) {
      return { success: false, error: 'INVALID_QUESTION_INDEX' };
    }

    // Check if player already answered this question
    if (game.answers[socketId]?.[questionIndex]) {
      return { success: false, error: 'ALREADY_ANSWERED' };
    }

    // Validate choice index
    const currentQuestion = game.questions[questionIndex];
    if (choiceIndex < 0 || choiceIndex >= currentQuestion.choices.length) {
      return { success: false, error: 'INVALID_CHOICE' };
    }

    // Check if answer is within time limit
    const questionStartTime = game.questionStartTime || game.startTime!;
    const timeElapsed = timestamp - questionStartTime;
    const timeLimit = room.settings.timePerQuestionSec * 1000;

    if (timeElapsed > timeLimit) {
      return { success: false, error: 'TIME_EXPIRED' };
    }

    // Store the answer
    if (!game.answers[socketId]) {
      game.answers[socketId] = {};
    }

    const answer: PlayerAnswer = {
      questionIndex,
      choiceIndex,
      timeMs: timeElapsed,
    };

    game.answers[socketId][questionIndex] = answer;

    // Calculate points
    const isCorrect = choiceIndex === currentQuestion.correctIndex;
    let pointsAwarded = 0;

    if (isCorrect) {
      pointsAwarded = 100; // Base points
      
      if (room.settings.scoring === 'timeBonus') {
        const timeBonus = Math.floor(((timeLimit - timeElapsed) / timeLimit) * 100);
        pointsAwarded += Math.max(0, timeBonus);
      }
    }

    player.score += pointsAwarded;

    console.log(`Player ${player.name} answered question ${questionIndex} in room ${roomId}: ${isCorrect ? 'correct' : 'incorrect'} (+${pointsAwarded} points)`);

    return {
      success: true,
      result: {
        isCorrect,
        pointsAwarded,
        correctChoiceIndex: currentQuestion.correctIndex,
        yourChoiceIndex: choiceIndex,
      }
    };
  }

  public checkAllPlayersAnswered(roomId: string): boolean {
    const room = this.roomManager.getRoom(roomId);
    if (!room || !room.game) return false;

    const connectedPlayers = room.players.filter(p => p.connected);
    const currentQuestionIndex = room.game.currentQuestionIndex;

    return connectedPlayers.every(player => 
      room.game!.answers[player.socketId]?.[currentQuestionIndex]
    );
  }

  public getRoundResults(roomId: string) {
    const room = this.roomManager.getRoom(roomId);
    if (!room || !room.game) return null;

    const game = room.game;
    const currentQuestion = game.questions[game.currentQuestionIndex];
    const scoreboard = room.players
      .filter(p => p.connected)
      .map(player => {
        const answer = game.answers[player.socketId]?.[game.currentQuestionIndex];
        return {
          name: player.name,
          score: player.score,
          lastAnswer: answer ? {
            choiceIndex: answer.choiceIndex,
            timeMs: answer.timeMs,
            isCorrect: answer.choiceIndex === currentQuestion.correctIndex,
            pointsAwarded: this.calculatePoints(answer, currentQuestion, room.settings.scoring, room.settings.timePerQuestionSec * 1000),
          } : undefined,
        };
      })
      .sort((a, b) => b.score - a.score);

    return {
      questionIndex: game.currentQuestionIndex,
      correctChoiceIndex: currentQuestion.correctIndex,
      scoreboard,
    };
  }

  public advanceToNextQuestion(roomId: string): boolean {
    const room = this.roomManager.getRoom(roomId);
    if (!room || !room.game) return false;

    room.game.currentQuestionIndex++;
    room.game.questionStartTime = Date.now();

    return room.game.currentQuestionIndex < room.game.questions.length;
  }

  public async endGame(roomId: string) {
    const room = this.roomManager.getRoom(roomId);
    if (!room || !room.game) return null;

    room.game.status = 'finished';

    // Calculate final leaderboard
    const finalLeaderboard = room.players
      .filter(p => p.connected)
      .map(player => ({
        name: player.name,
        score: player.score,
        rank: 0, // Will be set below
      }))
      .sort((a, b) => b.score - a.score);

    // Assign ranks
    finalLeaderboard.forEach((player, index) => {
      player.rank = index + 1;
    });

    const gameSummary = {
      totalQuestions: room.game.questions.length,
      duration: Date.now() - room.game.startTime!,
      roomName: room.roomName,
    };

    // Persist game to database
    try {
      await this.persistGameToDatabase(room);
    } catch (error) {
      console.error('Error persisting game to database:', error);
    }

    console.log(`Game ended in room ${roomId}`);

    return {
      finalLeaderboard,
      gameSummary,
    };
  }

  private calculatePoints(
    answer: PlayerAnswer,
    question: Question,
    scoringType: string,
    timeLimit: number
  ): number {
    const isCorrect = answer.choiceIndex === question.correctIndex;
    if (!isCorrect) return 0;

    let points = 100; // Base points

    if (scoringType === 'timeBonus') {
      const timeBonus = Math.floor(((timeLimit - answer.timeMs) / timeLimit) * 100);
      points += Math.max(0, timeBonus);
    }

    return points;
  }

  private async persistGameToDatabase(room: Room): Promise<void> {
    if (!room.game) return;

    try {
      // Insert game record
      const gameResult = await query(
        'INSERT INTO games (room_name, settings) VALUES (?, ?)',
        [room.roomName, JSON.stringify(room.settings)]
      );

      const gameId = (gameResult as any).insertId;

      // Insert player results
      const playerResults = room.players
        .filter(p => p.connected)
        .map(player => [gameId, player.name, player.score]);

      if (playerResults.length > 0) {
        const placeholders = playerResults.map(() => '(?, ?, ?)').join(', ');
        const flatValues = playerResults.flat();
        
        await query(
          `INSERT INTO game_results (game_id, player_name, score) VALUES ${placeholders}`,
          flatValues
        );
      }

      console.log(`Game persisted to database with ID: ${gameId}`);
    } catch (error) {
      console.error('Error persisting game to database:', error);
      throw error;
    }
  }

  public getCurrentQuestion(roomId: string) {
    const room = this.roomManager.getRoom(roomId);
    if (!room || !room.game) return null;

    const game = room.game;
    const question = game.questions[game.currentQuestionIndex];
    
    return {
      questionIndex: game.currentQuestionIndex,
      question: {
        id: question.id,
        text: question.text,
        choices: question.choices,
        // Note: correctIndex is NOT included for security
      },
      timePerQuestionSec: room.settings.timePerQuestionSec,
    };
  }

  public startQuestionTimer(roomId: string): void {
    const room = this.roomManager.getRoom(roomId);
    if (!room || !room.game) return;

    room.game.questionStartTime = Date.now();
  }
}
