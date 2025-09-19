'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, Select, Radio, Checkbox, Typography, Space, Row, Col, Badge, Alert } from 'antd';
import { ArrowLeftOutlined, UserOutlined, SettingOutlined, PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { SocketProvider, useSocket } from '@/lib/socket-client';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { NotificationToast } from '@/components/NotificationToast';
import { GameSettings, NewQuestionResponse, AnswerResultResponse, RoundResultsResponse, GameOverResponse } from '@/types/game';

const { Title, Text } = Typography;
const { Option } = Select;

export default function RoomPage() {
  return (
    <SocketProvider>
      <RoomContent />
      <ConnectionStatus />
      <NotificationToast />
    </SocketProvider>
  );
}

function RoomContent() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { socket, connected, room, player, sessionToken } = useSocket();
  
  // Game state
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'finished'>('lobby');
  const [currentQuestion, setCurrentQuestion] = useState<NewQuestionResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResultResponse | null>(null);
  const [roundResults, setRoundResults] = useState<RoundResultsResponse | null>(null);
  const [gameResults, setGameResults] = useState<GameOverResponse | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Reconnect to room if we have session token but no room
  useEffect(() => {
    if (socket && connected && sessionToken && !room && roomId) {
      console.log('Attempting to reconnect to room:', roomId, 'with token:', sessionToken);
      socket.emit('reconnect_room', { roomId, sessionToken });
    }
  }, [socket, connected, sessionToken, room, roomId]);

  // Auto-reconnect when page loads if we have stored session data
  useEffect(() => {
    if (socket && connected && !room && !sessionToken && roomId) {
      const storedToken = localStorage.getItem('quiz_session_token');
      const storedRoomId = localStorage.getItem('quiz_room_id');
      
      if (storedToken && storedRoomId === roomId) {
        console.log('Found stored session, attempting reconnect:', roomId);
        socket.emit('reconnect_room', { roomId: storedRoomId, sessionToken: storedToken });
      }
    }
  }, [socket, connected, room, sessionToken, roomId]);

  // Socket event listeners for game flow
  useEffect(() => {
    if (!socket) return;

    const handleGameStarted = () => {
      setGameState('playing');
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setRoundResults(null);
      setShowResults(false);
    };

    const handleNewQuestion = (data: NewQuestionResponse) => {
      setCurrentQuestion(data);
      // Don't set timeLeft here - let timer_tick handle it to avoid flickering
      setSelectedAnswer(null);
      setAnswerResult(null);
      setRoundResults(null);
      setShowResults(false);
    };

    const handleTimerTick = (data: { timeLeft: number }) => {
      setTimeLeft(data.timeLeft);
    };

    const handleAnswerReceived = (data: AnswerResultResponse) => {
      setAnswerResult(data);
    };

    const handleRoundResults = (data: RoundResultsResponse) => {
      setRoundResults(data);
      setShowResults(true);
      // Auto-hide results after 3 seconds
      setTimeout(() => setShowResults(false), 3000);
    };

    const handleGameOver = (data: GameOverResponse) => {
      setGameResults(data);
      setGameState('finished');
    };

    socket.on('game_started', handleGameStarted);
    socket.on('new_question', handleNewQuestion);
    socket.on('timer_tick', handleTimerTick);
    socket.on('answer_received', handleAnswerReceived);
    socket.on('round_results', handleRoundResults);
    socket.on('game_over', handleGameOver);

    return () => {
      socket.off('game_started', handleGameStarted);
      socket.off('new_question', handleNewQuestion);
      socket.off('timer_tick', handleTimerTick);
      socket.off('answer_received', handleAnswerReceived);
      socket.off('round_results', handleRoundResults);
      socket.off('game_over', handleGameOver);
    };
  }, [socket]);

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room...</p>
        </div>
      </div>
    );
  }

  if (gameState === 'lobby') {
    return <LobbyView room={room} player={player} socket={socket} />;
  }

  if (gameState === 'playing') {
    // Always get latest room/player from context for real-time updates
    const { room: liveRoom, player: livePlayer } = useSocket();
    return (
      <GameView
        room={liveRoom}
        player={livePlayer}
        socket={socket}
        currentQuestion={currentQuestion}
        timeLeft={timeLeft}
        selectedAnswer={selectedAnswer}
        setSelectedAnswer={setSelectedAnswer}
        answerResult={answerResult}
        roundResults={roundResults}
        showResults={showResults}
      />
    );
  }

  if (gameState === 'finished') {
    return <ResultsView room={room} gameResults={gameResults} onPlayAgain={() => setGameState('lobby')} />;
  }

  return null;
}

// Lobby Component
function LobbyView({ room, player, socket }: any) {
  const router = useRouter();
  const [settings, setSettings] = useState<GameSettings>(room.settings);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const isHost = player && room.hostId === player.sessionToken;

  // Load question counts when component mounts
  useEffect(() => {
    if (socket) {
      socket.emit('get_question_counts');
      socket.on('question_counts', (counts: Record<string, number>) => {
        setQuestionCounts(counts);
      });

      return () => {
        socket.off('question_counts');
      };
    }
  }, [socket]);

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    if (!isHost || !socket) return;
    
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    socket.emit('update_settings', { roomId: room.roomId, settings: updatedSettings });
  };

  const handleToggleReady = () => {
    if (!socket || !player) {
      console.log('Cannot toggle ready: socket or player missing', { socket: !!socket, player: !!player });
      return;
    }
    console.log('Toggling ready status:', { roomId: room.roomId, currentReady: player.ready, newReady: !player.ready });
    socket.emit('set_ready', { roomId: room.roomId, ready: !player.ready });
  };

  const handleStartGame = () => {
    if (!isHost || !socket) return;
    socket.emit('start_game', { roomId: room.roomId });
  };

  const connectedPlayers = room.players.filter((p: any) => p.connected);
  const allReady = (connectedPlayers.length === 1 && connectedPlayers[0].ready) || (connectedPlayers.length >= 2 && connectedPlayers.every((p: any) => p.ready));

  const [availableCategories, setAvailableCategories] = useState<Array<{id: string, name: string, questionCount?: number}>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch('/api/admin/categories');
        if (response.ok) {
          const data = await response.json();
          // Transform the data to match expected format
          const formattedCategories = data.map((cat: any) => ({
            id: cat.id,
            name: cat.name || cat.id.charAt(0).toUpperCase() + cat.id.slice(1),
            questionCount: cat.questionCount
          }));
          setAvailableCategories(formattedCategories);
        } else {
          // Fallback to default categories if API fails
          setAvailableCategories([
            { id: 'general', name: 'General Knowledge' },
            { id: 'science', name: 'Science' },
            { id: 'history', name: 'History' },
            { id: 'sports', name: 'Sports' },
            { id: 'technology', name: 'Technology' },
            { id: 'entertainment', name: 'Entertainment' },
            { id: 'geography', name: 'Geography' },
            { id: 'literature', name: 'Literature' },
          ]);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to default categories
        setAvailableCategories([
          { id: 'general', name: 'General Knowledge' },
          { id: 'science', name: 'Science' },
          { id: 'history', name: 'History' },
          { id: 'sports', name: 'Sports' },
          { id: 'technology', name: 'Technology' },
          { id: 'entertainment', name: 'Entertainment' },
          { id: 'geography', name: 'Geography' },
          { id: 'literature', name: 'Literature' },
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleSelectAllCategories = () => {
    if (!isHost) return;
    const allCategoryIds = availableCategories.map(cat => cat.id);
    handleUpdateSettings({ category: allCategoryIds });
  };

  const handleDeselectAllCategories = () => {
    if (!isHost) return;
    handleUpdateSettings({ category: [] });
  };

  const getTotalSelectedQuestions = () => {
    return settings.category.reduce((total, categoryId) => {
      return total + (questionCounts[categoryId] || 0);
    }, 0);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #111827 0%, #1F2937 50%, #374151 100%)',
      padding: '24px',
      fontFamily: '"Courier New", "Monaco", monospace'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header - Retro Style */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginBottom: '24px' }}>
            <Button
              onClick={() => router.push('/')}
              style={{
                background: '#374151',
                borderColor: '#6B7280',
                color: '#F9FAFB',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                position: 'absolute',
                left: '24px',
                top: '24px'
              }}
              className="retro-button"
              icon={<ArrowLeftOutlined />}
            >
              LEAVE ROOM
            </Button>
            <div style={{
              background: '#1F2937',
              border: '3px solid #8B5CF6',
              padding: '20px',
              boxShadow: '4px 4px 0px #000000'
            }}>
              <Title level={2} style={{
                color: '#F9FAFB',
                marginBottom: '8px',
                fontSize: '28px',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                {room.roomName}
              </Title>
              <Text style={{
                color: '#D1D5DB',
                fontSize: '16px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                ROOM CODE: <span style={{ fontFamily: '"Courier New", monospace', fontWeight: 'bold', fontSize: '18px', color: '#8B5CF6' }}>{room.roomId}</span>
              </Text>
            </div>
          </div>
        </div>

        <Row gutter={[32, 32]}>
          {/* Players List - Retro Style */}
          <Col xs={24} lg={8}>
            <Card style={{
              background: '#1F2937',
              border: '3px solid #06B6D4',
              color: '#F9FAFB'
            }} bodyStyle={{ padding: '20px' }} className="retro-card">
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: '#06B6D4',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #000000',
                  boxShadow: '2px 2px 0px #000000',
                  marginRight: '12px'
                }}>
                  <UserOutlined style={{ fontSize: '16px', color: 'white' }} />
                </div>
                <Title level={3} style={{
                  color: '#F9FAFB',
                  display: 'inline',
                  fontSize: '18px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  PLAYERS ({connectedPlayers.length}/{room.maxPlayers})
                </Title>
              </div>
              
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {connectedPlayers.map((p: any, index: number) => (
                  <div key={p.socketId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: '#374151',
                    border: '2px solid #4B5563'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        background: p.ready ? '#10B981' : '#6B7280',
                        border: '1px solid #000000'
                      }}></div>
                      <Text style={{
                        color: '#F9FAFB',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {p.name}
                      </Text>
                      {room.hostId === p.sessionToken && (
                        <Badge style={{
                          background: '#8B5CF6',
                          color: 'white',
                          border: '1px solid #000000',
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          HOST
                        </Badge>
                      )}
                    </div>
                    <Text style={{
                      color: p.ready ? '#10B981' : '#9CA3AF',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: 'bold'
                    }}>
                      {p.ready ? 'READY' : 'NOT READY'}
                    </Text>
                  </div>
                ))}
              </Space>
              
              {/* Ready Button - Retro Style */}
              <div style={{ marginTop: '24px' }}>
                <Button
                  onClick={handleToggleReady}
                  size="large"
                  style={{
                    width: '100%',
                    height: '48px',
                    background: player?.ready ? '#374151' : '#10B981',
                    borderColor: player?.ready ? '#6B7280' : '#10B981',
                    color: 'white',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                  className="retro-button"
                  icon={player?.ready ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
                >
                  {player?.ready ? 'NOT READY' : 'READY'}
                </Button>
              </div>

              {/* Start Game Button (Host Only) - Retro Style */}
              {isHost && (
                <div style={{ marginTop: '16px' }}>
                  <Button
                    onClick={handleStartGame}
                    disabled={!allReady}
                    size="large"
                    style={{
                      width: '100%',
                      height: '48px',
                      background: allReady ? '#8B5CF6' : '#4B5563',
                      borderColor: allReady ? '#8B5CF6' : '#6B7280',
                      color: 'white',
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                    className="retro-button"
                    icon={<PlayCircleOutlined />}
                  >
                    START GAME
                  </Button>
                  {!allReady && (
                    <Text style={{
                      color: '#9CA3AF',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      textAlign: 'center',
                      marginTop: '8px'
                    }}>
                      ALL PLAYERS MUST BE READY TO START
                    </Text>
                  )}
                </div>
              )}
            </Card>
          </Col>

          {/* Game Settings - Retro Style */}
          <Col xs={24} lg={16}>
            <Card style={{
              background: '#1F2937',
              border: '3px solid #F97316',
              color: '#F9FAFB'
            }} bodyStyle={{ padding: '20px' }} className="retro-card">
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: '#F97316',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #000000',
                  boxShadow: '2px 2px 0px #000000',
                  marginRight: '12px'
                }}>
                  <SettingOutlined style={{ fontSize: '16px', color: 'white' }} />
                </div>
                <Title level={3} style={{
                  color: '#F9FAFB',
                  display: 'inline',
                  fontSize: '18px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  GAME SETTINGS
                </Title>
                {!isHost && (
                  <Text style={{
                    color: '#9CA3AF',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'block',
                    marginTop: '8px'
                  }}>
                    ONLY THE HOST CAN MODIFY SETTINGS
                  </Text>
                )}
              </div>

              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <Text style={{
                        color: '#F9FAFB',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: 'bold'
                      }}>
                        CATEGORIES
                      </Text>
                      {isHost && (
                        <Space size="small">
                          <Button
                            onClick={handleSelectAllCategories}
                            size="small"
                            style={{
                              background: '#374151',
                              borderColor: '#6B7280',
                              color: '#F9FAFB',
                              fontSize: '10px',
                              textTransform: 'uppercase'
                            }}
                            className="retro-button"
                          >
                            SELECT ALL
                          </Button>
                          <Button
                            onClick={handleDeselectAllCategories}
                            size="small"
                            style={{
                              background: '#374151',
                              borderColor: '#6B7280',
                              color: '#F9FAFB',
                              fontSize: '10px',
                              textTransform: 'uppercase'
                            }}
                            className="retro-button"
                          >
                            DESELECT ALL
                          </Button>
                        </Space>
                      )}
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        {availableCategories.map((category) => (
                          <div key={category.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px',
                            background: '#374151',
                            border: '1px solid #4B5563'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Checkbox
                                checked={settings.category.includes(category.id)}
                                onChange={(e) => {
                                  if (!isHost) return;
                                  const newCategories = e.target.checked
                                    ? [...settings.category, category.id]
                                    : settings.category.filter(c => c !== category.id);
                                  handleUpdateSettings({ category: newCategories });
                                }}
                                disabled={!isHost}
                                style={{ color: '#8B5CF6' }}
                              />
                              <Text style={{
                                color: '#F9FAFB',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: 'bold'
                              }}>
                                {category.name}
                              </Text>
                            </div>
                            <Badge style={{
                              background: '#4B5563',
                              color: '#D1D5DB',
                              border: '1px solid #6B7280',
                              fontSize: '10px'
                            }}>
                              {questionCounts[category.id] || 0} QUESTIONS
                            </Badge>
                          </div>
                        ))}
                      </Space>
                    </div>
                    <Alert
                      message={`TOTAL AVAILABLE QUESTIONS: ${getTotalSelectedQuestions()}`}
                      type="info"
                      style={{
                        marginTop: '12px',
                        background: '#1F2937',
                        border: '2px solid #06B6D4',
                        color: '#F9FAFB'
                      }}
                      className="retro-alert"
                    />
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                      <Text style={{
                        color: '#F9FAFB',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: 'bold',
                        display: 'block',
                        marginBottom: '8px'
                      }}>
                        NUMBER OF QUESTIONS
                      </Text>
                      <Select
                        value={settings.numQuestions}
                        onChange={(value) => handleUpdateSettings({ numQuestions: value })}
                        disabled={!isHost}
                        style={{
                          width: '100%'
                        }}
                        className="retro-select"
                      >
                        <Option value={5}>5 QUESTIONS</Option>
                        <Option value={10}>10 QUESTIONS</Option>
                        <Option value={15}>15 QUESTIONS</Option>
                        <Option value={20}>20 QUESTIONS</Option>
                      </Select>
                    </div>

                    <div>
                      <Text style={{
                        color: '#F9FAFB',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: 'bold',
                        display: 'block',
                        marginBottom: '8px'
                      }}>
                        TIME PER QUESTION
                      </Text>
                      <Select
                        value={settings.timePerQuestionSec}
                        onChange={(value) => handleUpdateSettings({ timePerQuestionSec: value })}
                        disabled={!isHost}
                        style={{
                          width: '100%'
                        }}
                        className="retro-select"
                      >
                        <Option value={10}>10 SECONDS</Option>
                        <Option value={15}>15 SECONDS</Option>
                        <Option value={20}>20 SECONDS</Option>
                        <Option value={30}>30 SECONDS</Option>
                      </Select>
                    </div>

                    <div>
                      <Text style={{
                        color: '#F9FAFB',
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: 'bold',
                        display: 'block',
                        marginBottom: '8px'
                      }}>
                        SCORING
                      </Text>
                      <Radio.Group
                        value={settings.scoring}
                        onChange={(e) => handleUpdateSettings({ scoring: e.target.value })}
                        disabled={!isHost}
                        style={{ width: '100%' }}
                      >
                        <Space direction="vertical">
                          <Radio value="base" style={{ color: '#F9FAFB' }}>
                            <Text style={{
                              color: '#F9FAFB',
                              fontSize: '12px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              BASE SCORING
                            </Text>
                          </Radio>
                          <Radio value="timeBonus" style={{ color: '#F9FAFB' }}>
                            <Text style={{
                              color: '#F9FAFB',
                              fontSize: '12px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              TIME BONUS
                            </Text>
                          </Radio>
                        </Space>
                      </Radio.Group>
                    </div>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

// Game Component
function GameView({ room, player, socket, currentQuestion, timeLeft, selectedAnswer, setSelectedAnswer, answerResult, roundResults, showResults }: any) {
  const handleAnswerSelect = (choiceIndex: number) => {
    if (!socket || !currentQuestion || selectedAnswer !== null) return;
    
    setSelectedAnswer(choiceIndex);
    socket.emit('answer', {
      roomId: room.roomId,
      questionIndex: currentQuestion.questionIndex,
      choiceIndex,
      timestamp: Date.now(),
    });
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Timer */}
        <div className="mb-8">
          <div
            className="timer-bar"
            style={{
              height: '20px',
              background: '#111827',
              border: '3px solid #8B5CF6',
              borderRadius: '12px',
              boxShadow: '4px 4px 0px #000',
              overflow: 'hidden',
            }}
          >
            <div
              className="timer-fill"
              style={{
                width: `${(timeLeft / currentQuestion.timePerQuestionSec) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #8B5CF6 0%, #06B6D4 100%)',
                borderRight: '3px solid #000',
                transition: 'width 1s linear',
              }}
            ></div>
          </div>
          {/* <div className="text-center mt-2">
            <span
              className="font-bold"
              style={{
                display: 'inline-block',
                background: '#1F2937',
                color: '#F9FAFB',
                border: '3px solid #06B6D4',
                boxShadow: '3px 3px 0px #000',
                borderRadius: '12px',
                padding: '6px 12px',
                letterSpacing: '1px',
                fontSize: '20px',
                fontFamily: '"Courier New", monospace',
              }}
            >
              ⏱️ {timeLeft}s
            </span>
          </div> */}
        </div>

        {/* Question */}
        <div className="card mb-6" style={{ background: '#1F2937', border: '3px solid #8B5CF6', boxShadow: '4px 4px 0px #000', borderRadius: '16px', color: '#F9FAFB' }}>
          <div className="text-center">
            <div className="text-sm text-gray-200 mb-2">
              Question {currentQuestion.questionIndex + 1}
            </div>
            <h2 className="text-2xl font-semibold mb-6">
              {currentQuestion.question.text}
            </h2>
          </div>

          {/* Answer Choices */}
          <div className="grid md:grid-cols-2 gap-4">
            {currentQuestion.question.choices.map((choice: string, index: number) => {
              let buttonClass = 'answer-button';
              
              if (showResults && roundResults) {
                if (index === roundResults.correctChoiceIndex) {
                  buttonClass = 'answer-button-correct';
                } else if (index === selectedAnswer) {
                  buttonClass = 'answer-button-incorrect';
                }
              } else if (selectedAnswer === index) {
                buttonClass = 'answer-button-selected';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null || timeLeft <= 0}
                  className={buttonClass}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center font-semibold">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span>{choice}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Answer Result */}
          {answerResult && (
            <div className="mt-6 text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
                answerResult.isCorrect ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
              }`}>
                {answerResult.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                <span className="ml-2 font-semibold">+{answerResult.pointsAwarded} points</span>
              </div>
            </div>
          )}
        </div>

        {/* Scoreboard */}
        <div className="card" style={{ background: '#1F2937', border: '3px solid #06B6D4', boxShadow: '4px 4px 0px #000', borderRadius: '16px', color: '#F9FAFB' }}>
          <h3 className="text-lg font-semibold mb-4">Leaderboard</h3>
          <div className="space-y-2 text-gray-800">
            {room.players
              .filter((p: any) => p.connected)
              .sort((a: any, b: any) => b.score - a.score)
              .map((p: any, index: number) => (
                <div key={p.socketId} className={`leaderboard-item ${
                  index === 0 ? 'leaderboard-item-first' : 
                  index === 1 ? 'leaderboard-item-second' : 
                  index === 2 ? 'leaderboard-item-third' : ''
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-lg">#{index + 1}</span>
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <span className="font-bold text-lg">{p.score}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Results Component
function ResultsView({ room, gameResults, onPlayAgain }: any) {
  const router = useRouter();

  if (!gameResults) return null;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold gradient-text mb-8">Game Complete!</h1>
        
        <div className="card mb-8">
          <h2 className="text-2xl font-semibold mb-6">Final Results</h2>
          <div className="space-y-4">
            {gameResults.finalLeaderboard.map((player: any, index: number) => (
              <div key={player.name} className={`leaderboard-item ${
                index === 0 ? 'leaderboard-item-first' : 
                index === 1 ? 'leaderboard-item-second' : 
                index === 2 ? 'leaderboard-item-third' : ''
              }`}>
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <span className="font-medium text-lg">{player.name}</span>
                </div>
                <span className="font-bold text-xl">{player.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card mb-8">
          <h3 className="text-lg font-semibold mb-4">Game Summary</h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600">{gameResults.gameSummary.totalQuestions}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">
                {Math.round(gameResults.gameSummary.duration / 60000)}m
              </div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">{gameResults.finalLeaderboard.length}</div>
              <div className="text-sm text-gray-600">Players</div>
            </div>
          </div>
        </div>

        <div className="space-x-4">
          <button onClick={onPlayAgain} className="btn-primary btn-lg">
            Play Again
          </button>
          <button onClick={() => router.push('/')} className="btn-secondary btn-lg">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
