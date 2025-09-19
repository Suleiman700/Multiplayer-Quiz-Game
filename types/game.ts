export interface Player {
  socketId: string;
  name: string;
  score: number;
  ready: boolean;
  connected: boolean;
  lastSeen: number;
  sessionToken?: string;
  avatar?: string;
  isBot?: boolean;
}

export interface GameSettings {
  category: string[];
  numQuestions: number;
  timePerQuestionSec: number;
  shuffleAnswers: boolean;
  scoring: 'base' | 'timeBonus';
}

export interface Question {
  id: string;
  text: string;
  choices: string[];
  correctIndex: number;
  category: string;
}

export interface GameQuestion {
  id: string;
  text: string;
  choices: string[];
  // Note: correctIndex is NOT sent to clients
}

export interface PlayerAnswer {
  questionIndex: number;
  choiceIndex: number;
  timeMs: number;
}

export interface Game {
  status: 'waiting' | 'running' | 'finished';
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, Record<number, PlayerAnswer>>;
  startTime?: number;
  questionStartTime?: number;
}

export interface Room {
  roomId: string;
  hostId: string;
  roomName: string;
  passwordHash?: string;
  maxPlayers: number;
  players: Player[];
  settings: GameSettings;
  game?: Game;
  createdAt: number;
}

// Socket Event Types
export interface CreateRoomData {
  roomName: string;
  maxPlayers: number;
  password?: string;
  hostName: string;
  settings?: Partial<GameSettings>;
}

export interface JoinRoomData {
  roomId: string;
  name: string;
  password?: string;
}

export interface AnswerData {
  roomId: string;
  questionIndex: number;
  choiceIndex: number;
  timestamp: number;
}

export interface UpdateSettingsData {
  roomId: string;
  settings: Partial<GameSettings>;
}

// Server Response Types
export interface RoomCreatedResponse {
  roomId: string;
  hostToken: string;
  roomState: Room;
}

export interface JoinedRoomResponse {
  roomState: Room;
  sessionToken: string;
}

export interface NewQuestionResponse {
  roomId: string;
  questionIndex: number;
  question: GameQuestion;
  timePerQuestionSec: number;
}

export interface AnswerResultResponse {
  questionIndex: number;
  correctChoiceIndex: number;
  yourChoiceIndex: number;
  pointsAwarded: number;
  isCorrect: boolean;
}

export interface RoundResultsResponse {
  questionIndex: number;
  correctChoiceIndex: number;
  scoreboard: Array<{
    name: string;
    score: number;
    lastAnswer?: {
      choiceIndex: number;
      timeMs: number;
      isCorrect: boolean;
      pointsAwarded: number;
    };
  }>;
}

export interface GameOverResponse {
  finalLeaderboard: Array<{
    name: string;
    score: number;
    rank: number;
  }>;
  gameSummary: {
    totalQuestions: number;
    duration: number;
    roomName: string;
  };
}

export interface ErrorResponse {
  code: string;
  message: string;
}

// Database Types
export interface DBQuestion {
  id: number;
  category: string;
  question_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_choice: 'A' | 'B' | 'C' | 'D';
  created_at: Date;
}

export interface DBGame {
  id: number;
  room_name: string;
  settings: string; // JSON string
  created_at: Date;
}

export interface DBGameResult {
  id: number;
  game_id: number;
  player_name: string;
  score: number;
}
