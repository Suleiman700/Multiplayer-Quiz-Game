'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SocketProvider, useSocket } from '@/lib/socket-client';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { NotificationToast } from '@/components/NotificationToast';
import { GameSettings } from '@/types/game';
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  Checkbox, 
  Radio, 
  Space, 
  Row, 
  Col, 
  Typography, 
  Avatar,
  Spin,
  Divider
} from 'antd';
import {
  ArrowLeftOutlined,
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  LockOutlined,
  UnlockOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  ShuffleOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function CreateRoomPage() {
  return (
    <SocketProvider>
      <CreateRoomContent />
      <ConnectionStatus />
      <NotificationToast />
    </SocketProvider>
  );
}

function CreateRoomContent() {
  const router = useRouter();
  const { socket, connected, room } = useSocket();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    roomName: '',
    hostName: '',
    maxPlayers: 10,
    password: '',
    usePassword: false,
  });
  const [settings, setSettings] = useState<GameSettings>({
    category: ['general'],
    numQuestions: 10,
    timePerQuestionSec: 15,
    shuffleAnswers: true,
    scoring: 'base' as const,
  });

  // Redirect to room if already created
  React.useEffect(() => {
    if (room) {
      router.push(`/room/${room.roomId}`);
    }
  }, [room, router]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !connected) return;

    setIsCreating(true);
    
    try {
      socket.emit('create_room', {
        roomName: formData.roomName,
        hostName: formData.hostName,
        maxPlayers: formData.maxPlayers,
        password: formData.usePassword ? formData.password : undefined,
        settings,
      });
    } catch (error) {
      console.error('Error creating room:', error);
      setIsCreating(false);
    }
  };

  const [categories, setCategories] = useState<Array<{id: string, name: string, questionCount?: number}>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Load categories from API
  React.useEffect(() => {
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
          setCategories(formattedCategories);
        } else {
          // Fallback to default categories if API fails
          setCategories([
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
        setCategories([
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

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #111827 0%, #1F2937 50%, #374151 100%)',
      padding: '24px',
      fontFamily: '"Courier New", "Monaco", monospace'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header - Retro Style */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Button
            onClick={() => router.push('/')}
            size="large"
            style={{
              background: '#8B5CF6',
              borderColor: '#8B5CF6',
              color: 'white',
              marginBottom: '32px',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
            icon={<ArrowLeftOutlined />}
            className="retro-button"
          >
            &lt; BACK TO HOME
          </Button>
          
          <div style={{ 
            background: '#1F2937',
            border: '3px solid #8B5CF6',
            padding: '32px',
            marginBottom: '24px',
            boxShadow: '6px 6px 0px #000000'
          }}>
            <Title 
              level={1} 
              style={{ 
                color: '#F9FAFB', 
                marginBottom: '16px',
                fontSize: '32px',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}
              className="retro-gradient-text"
            >
              CREATE ROOM
            </Title>
            <Text style={{ 
              color: '#D1D5DB', 
              fontSize: '16px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              SET UP YOUR QUIZ BATTLE ARENA
            </Text>
          </div>
        </div>

        <form onSubmit={handleCreateRoom}>
          <Row gutter={[32, 32]}>
            {/* Room Settings - Retro Style */}
            <Col xs={24} lg={12}>
              <Card
                style={{
                  background: '#1F2937',
                  border: '3px solid #8B5CF6',
                  color: '#F9FAFB'
                }}
                bodyStyle={{ padding: '24px' }}
                className="retro-card"
              >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: '#8B5CF6',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #000000',
                    boxShadow: '3px 3px 0px #000000'
                  }}>
                    <HomeOutlined style={{ fontSize: '24px', color: 'white' }} />
                  </div>
                  <Title level={3} style={{ 
                    color: '#F9FAFB', 
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '18px'
                  }}>
                    ROOM SETTINGS
                  </Title>
                  <Text style={{ color: '#D1D5DB', textTransform: 'uppercase', fontSize: '12px' }}>
                    CONFIGURE YOUR QUIZ ROOM
                  </Text>
                </div>

                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ 
                      color: '#F9FAFB', 
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      display: 'block',
                      marginBottom: '8px'
                    }}>
                      ROOM NAME *
                    </Text>
                    <Input
                      size="large"
                      value={formData.roomName}
                      onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                      placeholder="ENTER ROOM NAME"
                      maxLength={50}
                      style={{ 
                        background: '#374151',
                        borderColor: '#6B7280',
                        color: '#F9FAFB',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <Text strong style={{ 
                      color: '#F9FAFB', 
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      display: 'block',
                      marginBottom: '8px'
                    }}>
                      YOUR NAME *
                    </Text>
                    <Input
                      size="large"
                      value={formData.hostName}
                      onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                      placeholder="ENTER YOUR NAME"
                      maxLength={20}
                      style={{ 
                        background: '#374151',
                        borderColor: '#6B7280',
                        color: '#F9FAFB',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <Text strong style={{ 
                      color: '#F9FAFB', 
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      display: 'block',
                      marginBottom: '8px'
                    }}>
                      MAX PLAYERS
                    </Text>
                    <Select
                      size="large"
                      value={formData.maxPlayers}
                      onChange={(value) => setFormData({ ...formData, maxPlayers: value })}
                      style={{ width: '100%' }}
                      dropdownStyle={{ 
                        background: '#374151',
                        borderColor: '#6B7280'
                      }}
                    >
                      {[...Array(49)].map((_, i) => (
                        <Option key={i + 2} value={i + 2}>
                          {i + 2} PLAYERS
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Checkbox
                      checked={formData.usePassword}
                      onChange={(e) => setFormData({ ...formData, usePassword: e.target.checked })}
                      style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold',
                        color: '#F9FAFB',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}
                    >
                      PASSWORD PROTECT ROOM
                    </Checkbox>
                    {formData.usePassword && (
                      <Input.Password
                        size="large"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="ENTER PASSWORD"
                        maxLength={50}
                        style={{ 
                          background: '#374151',
                          borderColor: '#6B7280',
                          color: '#F9FAFB',
                          fontSize: '14px',
                          marginTop: '12px'
                        }}
                      />
                    )}
                  </div>
                </Space>
              </Card>
            </Col>

            {/* Game Settings - Retro Style */}
            <Col xs={24} lg={12}>
              <Card
                style={{
                  background: '#1F2937',
                  border: '3px solid #06B6D4',
                  color: '#F9FAFB'
                }}
                bodyStyle={{ padding: '24px' }}
                className="retro-card"
              >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: '#06B6D4',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #000000',
                    boxShadow: '3px 3px 0px #000000'
                  }}>
                    <SettingOutlined style={{ fontSize: '24px', color: 'white' }} />
                  </div>
                  <Title level={3} style={{ 
                    color: '#F9FAFB', 
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '18px'
                  }}>
                    GAME SETTINGS
                  </Title>
                  <Text style={{ color: '#D1D5DB', textTransform: 'uppercase', fontSize: '12px' }}>
                    CUSTOMIZE YOUR QUIZ EXPERIENCE
                  </Text>
                </div>

                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ fontSize: '16px' }}>Categories</Text>
                    {categoriesLoading ? (
                      <div style={{ textAlign: 'center', padding: '24px' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: '12px' }}>
                          <Text style={{ color: '#666' }}>Loading categories...</Text>
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '12px',
                        marginTop: '12px',
                        padding: '16px',
                        background: 'rgba(78, 205, 196, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(78, 205, 196, 0.1)'
                      }}>
                        {categories.map((category) => (
                          <Checkbox
                            key={category.id}
                            checked={settings.category.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSettings({
                                  ...settings,
                                  category: [...settings.category, category.id],
                                });
                              } else {
                                setSettings({
                                  ...settings,
                                  category: settings.category.filter(c => c !== category.id),
                                });
                              }
                            }}
                            style={{ fontSize: '14px', fontWeight: 'bold' }}
                          >
                            {category.name}
                            {category.questionCount !== undefined && (
                              <Text style={{ color: '#888', fontSize: '12px' }}> ({category.questionCount})</Text>
                            )}
                          </Checkbox>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Text strong style={{ fontSize: '16px' }}>Number of Questions</Text>
                    <Select
                      size="large"
                      value={settings.numQuestions}
                      onChange={(value) => setSettings({ ...settings, numQuestions: value })}
                      style={{ 
                        width: '100%',
                        marginTop: '8px'
                      }}
                      dropdownStyle={{ borderRadius: '12px' }}
                    >
                      <Option value={5}>📝 5 questions</Option>
                      <Option value={10}>📝 10 questions</Option>
                      <Option value={15}>📝 15 questions</Option>
                      <Option value={20}>📝 20 questions</Option>
                      <Option value={25}>📝 25 questions</Option>
                    </Select>
                  </div>

                  <div>
                    <Text strong style={{ fontSize: '16px' }}>Time per Question</Text>
                    <Select
                      size="large"
                      value={settings.timePerQuestionSec}
                      onChange={(value) => setSettings({ ...settings, timePerQuestionSec: value })}
                      style={{ 
                        width: '100%',
                        marginTop: '8px'
                      }}
                      dropdownStyle={{ borderRadius: '12px' }}
                    >
                      <Option value={10}>⏱️ 10 seconds</Option>
                      <Option value={15}>⏱️ 15 seconds</Option>
                      <Option value={20}>⏱️ 20 seconds</Option>
                      <Option value={30}>⏱️ 30 seconds</Option>
                      <Option value={45}>⏱️ 45 seconds</Option>
                      <Option value={60}>⏱️ 60 seconds</Option>
                    </Select>
                  </div>

                  <div>
                    <Text strong style={{ fontSize: '16px', marginBottom: '12px', display: 'block' }}>Scoring Type</Text>
                    <Radio.Group
                      value={settings.scoring}
                      onChange={(e) => setSettings({ ...settings, scoring: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Radio 
                          value="base" 
                          style={{ 
                            fontSize: '14px', 
                            fontWeight: 'bold',
                            padding: '12px',
                            background: settings.scoring === 'base' ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                            borderRadius: '8px',
                            width: '100%'
                          }}
                        >
                          🎯 Base scoring (100 points per correct answer)
                        </Radio>
                        <Radio 
                          value="timeBonus" 
                          style={{ 
                            fontSize: '14px', 
                            fontWeight: 'bold',
                            padding: '12px',
                            background: settings.scoring === 'timeBonus' ? 'rgba(255, 107, 107, 0.1)' : 'transparent',
                            borderRadius: '8px',
                            width: '100%'
                          }}
                        >
                          ⚡ Time bonus (faster answers get more points)
                        </Radio>
                      </Space>
                    </Radio.Group>
                  </div>

                  <div>
                    <Checkbox
                      checked={settings.shuffleAnswers}
                      onChange={(e) => setSettings({ ...settings, shuffleAnswers: e.target.checked })}
                      style={{ fontSize: '16px', fontWeight: 'bold' }}
                    >
                      🔀 Shuffle answer choices
                    </Checkbox>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Create Button - Cartoon Style */}
          <div style={{ textAlign: 'center', margin: '48px 0' }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isCreating}
              disabled={
                !connected || 
                isCreating || 
                !formData.roomName.trim() || 
                !formData.hostName.trim() ||
                settings.category.length === 0 ||
                (formData.usePassword && !formData.password.trim())
              }
              style={{
                borderRadius: '16px',
                fontSize: '22px',
                fontWeight: 800,
                height: '68px',
                minWidth: '240px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                border: '3px solid #000000',
                boxShadow: '6px 6px 0px #000000',
                textShadow: '0 1px 0 rgba(0, 0, 0, 0.25)',
                transition: 'transform 0.08s ease-in-out, box-shadow 0.08s ease-in-out, filter 0.2s ease',
                filter: 'drop-shadow(0 0 12px rgba(139, 92, 246, 0.35))',
                cursor: 'pointer'
              }}
              icon={!isCreating && <PlayCircleOutlined />}
              className="cartoon-button pulse-glow wiggle-on-hover"
            >
              {isCreating ? '🎪 Creating Room...' : '🚀 Create Room!'}
            </Button>
          </div>

          {/* Preview */}
          <div className="card" style={{
            background: '#1F2937',
            border: '3px solid #8B5CF6',
            boxShadow: '6px 6px 0px #000000',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '32px'
          }}>
            <h3 className="text-lg font-semibold text-gray-200 mb-4" style={{
              color: '#E5E7EB',
              fontSize: '20px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>Room Preview</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium text-gray-200">Room:</span> {formData.roomName || 'Untitled Room'}
              </div>
              <div>
                <span className="font-medium text-gray-200">Host:</span> {formData.hostName || 'Unknown'}
              </div>
              <div>
                <span className="font-medium text-gray-200">Max Players:</span> {formData.maxPlayers}
              </div>
              <div>
                <span className="font-medium text-gray-200">Password:</span> {formData.usePassword ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium text-gray-200">Questions:</span> {settings.numQuestions}
              </div>
              <div>
                <span className="font-medium text-gray-200">Time per Question:</span> {settings.timePerQuestionSec}s
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-200">Categories:</span>{' '}
                {settings.category.length > 0 
                  ? settings.category.map(c => categories.find(cat => cat.id === c)?.name).join(', ')
                  : 'None selected'
                }
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
