'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SocketProvider, useSocket } from '@/lib/socket-client';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { NotificationToast } from '@/components/NotificationToast';
import { 
  Card, 
  Button, 
  Input, 
  Checkbox, 
  Space, 
  Row, 
  Col, 
  Typography
} from 'antd';
import {
  ArrowLeftOutlined,
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  LockOutlined,
  UnlockOutlined,
  PlayCircleOutlined,
  
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

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
  // Game settings are configured later in the lobby

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
        // No settings here; Host will configure in the lobby
      });
    } catch (error) {
      console.error('Error creating room:', error);
      setIsCreating(false);
    }
  };

  // No game settings on this page; they will be configured in the lobby

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
            // background: '#1F2937',
            // border: '3px solid #8B5CF6',
            padding: '32px',
            marginBottom: '24px',
            // boxShadow: '6px 6px 0px #000000'
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
          <Row gutter={[32, 32]} justify="center">
            {/* Room Basics - Retro Style */}
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
                    ROOM BASICS
                  </Title>
                  <Text style={{ color: '#D1D5DB', textTransform: 'uppercase', fontSize: '12px' }}>
                    ENTER ROOM NAME, YOUR NAME, AND PASSWORD
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

                  {/* Max players hidden here; host can change in the lobby if needed */}

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

            {/* Right column intentionally removed; settings are configured in the lobby */}
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

          {/* Preview - simplified */}
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
              <div className="md:col-span-2" style={{ color: '#9CA3AF' }}>
                Game settings will be customized in the lobby after the room is created.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
