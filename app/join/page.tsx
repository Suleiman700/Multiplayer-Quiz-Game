'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Input, Typography, Space, Alert } from 'antd';
import { ArrowLeftOutlined, TeamOutlined, InfoCircleOutlined, WarningOutlined, PlusOutlined } from '@ant-design/icons';
import { SocketProvider, useSocket } from '@/lib/socket-client';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { NotificationToast } from '@/components/NotificationToast';

const { Title, Text } = Typography;

export default function JoinRoomPage() {
  return (
    <SocketProvider>
      <JoinRoomContent />
      <ConnectionStatus />
      <NotificationToast />
    </SocketProvider>
  );
}

function JoinRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket, connected, room, error } = useSocket();
  const [isJoining, setIsJoining] = useState(false);
  const [formData, setFormData] = useState({
    roomId: '',
    playerName: '',
    password: '',
  });

  // Pre-fill form from URL params
  useEffect(() => {
    const roomFromUrl = searchParams.get('room');
    const nameFromUrl = searchParams.get('name');
    
    if (roomFromUrl || nameFromUrl) {
      setFormData(prev => ({
        ...prev,
        roomId: roomFromUrl || prev.roomId,
        playerName: nameFromUrl || prev.playerName,
      }));
    }
  }, [searchParams]);

  // Redirect to room if successfully joined
  useEffect(() => {
    if (room) {
      router.push(`/room/${room.roomId}`);
    }
  }, [room, router]);

  // Reset joining state on error
  useEffect(() => {
    if (error) {
      setIsJoining(false);
    }
  }, [error]);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !connected) return;

    setIsJoining(true);
    
    try {
      socket.emit('join_room', {
        roomId: formData.roomId.toUpperCase(),
        name: formData.playerName,
        password: formData.password || undefined,
      });
    } catch (error) {
      console.error('Error joining room:', error);
      setIsJoining(false);
    }
  };

  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setFormData({ ...formData, roomId: value });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #111827 0%, #1F2937 50%, #374151 100%)',
      padding: '24px',
      fontFamily: '"Courier New", "Monaco", monospace',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ maxWidth: '500px', width: '100%' }}>
        {/* Header - Retro Style */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Button
            onClick={() => router.push('/')}
            style={{
              background: '#374151',
              borderColor: '#6B7280',
              color: '#F9FAFB',
              marginBottom: '24px',
              textTransform: 'uppercase',
              fontWeight: 'bold'
            }}
            className="retro-button"
            icon={<ArrowLeftOutlined />}
          >
            BACK TO HOME
          </Button>
          
          <div style={{
            background: '#1F2937',
            border: '3px solid #06B6D4',
            padding: '24px',
            marginBottom: '16px',
            boxShadow: '6px 6px 0px #000000'
          }}>
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
              <TeamOutlined style={{ fontSize: '24px', color: 'white' }} />
            </div>
            <Title level={1} style={{
              color: '#F9FAFB',
              marginBottom: '8px',
              fontSize: '32px',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              JOIN ROOM
            </Title>
            <Text style={{
              color: '#D1D5DB',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              ENTER ROOM CODE TO JOIN QUIZ BATTLE
            </Text>
          </div>
        </div>

        {/* Join Form - Retro Style */}
        <Card style={{
          background: '#1F2937',
          border: '3px solid #8B5CF6',
          color: '#F9FAFB',
          marginBottom: '32px'
        }} bodyStyle={{ padding: '24px' }} className="retro-card">
          <form onSubmit={handleJoinRoom}>
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
                  ROOM CODE *
                </Text>
                <Input
                  value={formData.roomId}
                  onChange={handleRoomIdChange}
                  placeholder="ABC123"
                  required
                  maxLength={6}
                  style={{
                    background: '#374151',
                    borderColor: '#6B7280',
                    color: '#F9FAFB',
                    textAlign: 'center',
                    fontSize: '18px',
                    fontFamily: '"Courier New", monospace',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}
                  className="retro-input"
                />
                <Text style={{
                  color: '#9CA3AF',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginTop: '4px'
                }}>
                  6-CHARACTER CODE FROM HOST
                </Text>
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
                  YOUR NAME *
                </Text>
                <Input
                  value={formData.playerName}
                  onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                  placeholder="ENTER YOUR NAME"
                  required
                  maxLength={20}
                  style={{
                    background: '#374151',
                    borderColor: '#6B7280',
                    color: '#F9FAFB',
                    textTransform: 'uppercase'
                  }}
                  className="retro-input"
                />
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
                  PASSWORD (IF REQUIRED)
                </Text>
                <Input.Password
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="ENTER ROOM PASSWORD"
                  maxLength={50}
                  style={{
                    background: '#374151',
                    borderColor: '#6B7280',
                    color: '#F9FAFB'
                  }}
                  className="retro-input"
                />
              </div>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                disabled={
                  !connected || 
                  isJoining || 
                  !formData.roomId.trim() || 
                  !formData.playerName.trim()
                }
                loading={isJoining}
                style={{
                  background: '#8B5CF6',
                  borderColor: '#8B5CF6',
                  color: 'white',
                  width: '100%',
                  height: '48px',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
                className="retro-button"
              >
                {isJoining ? 'JOINING ROOM...' : 'JOIN ROOM'}
              </Button>
            </Space>
          </form>
        </Card>

        {/* Help Section - Retro Style */}
        <Card style={{
          background: '#1F2937',
          border: '3px solid #F97316',
          color: '#F9FAFB',
          marginBottom: '24px'
        }} bodyStyle={{ padding: '20px' }} className="retro-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#F97316',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #000000',
              boxShadow: '2px 2px 0px #000000',
              flexShrink: 0
            }}>
              <InfoCircleOutlined style={{ fontSize: '16px', color: 'white' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <Title level={4} style={{
                color: '#F9FAFB',
                marginBottom: '12px',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                NEED HELP?
              </Title>
              <div style={{ color: '#D1D5DB', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <div style={{ marginBottom: '4px' }}>• ASK HOST FOR ROOM CODE</div>
                <div style={{ marginBottom: '4px' }}>• CODES ARE 6 CHARACTERS LONG</div>
                <div style={{ marginBottom: '4px' }}>• SOME ROOMS NEED PASSWORD</div>
                <div>• CHECK INTERNET CONNECTION</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions - Retro Style */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Button
            onClick={() => router.push('/create')}
            style={{
              background: '#374151',
              borderColor: '#6B7280',
              color: '#F9FAFB',
              textTransform: 'uppercase',
              fontWeight: 'bold'
            }}
            className="retro-button"
            icon={<PlusOutlined />}
          >
            CREATE ROOM INSTEAD
          </Button>
        </div>

        {/* Connection Status Info - Retro Style */}
        {!connected && (
          <Alert
            message="CONNECTION REQUIRED"
            description="PLEASE WAIT FOR CONNECTION TO ESTABLISH BEFORE JOINING A ROOM."
            type="warning"
            icon={<WarningOutlined />}
            style={{
              background: '#1F2937',
              border: '2px solid #F59E0B',
              color: '#F9FAFB'
            }}
            className="retro-alert"
          />
        )}
      </div>
    </div>
  );
}
