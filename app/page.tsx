'use client';

import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Button, Card, Input, Typography, Space, Row, Col, Avatar, Badge, Divider, Modal, Steps} from 'antd';
import {
    PlayCircleOutlined,
    PlusOutlined,
    TeamOutlined,
    SettingOutlined,
    TrophyOutlined,
    StarOutlined,
    RocketOutlined,
    HeartOutlined,
    ThunderboltOutlined,
    BulbOutlined,
    FireOutlined, QuestionCircleOutlined
} from '@ant-design/icons';
import {SocketProvider} from '@/lib/socket-client';
import {ConnectionStatus} from '@/components/ConnectionStatus';
import {NotificationToast} from '@/components/NotificationToast';

const {Title, Text, Paragraph} = Typography;

export default function HomePage() {
    return (
        <SocketProvider>
            <HomeContent/>
            <ConnectionStatus/>
            <NotificationToast/>
        </SocketProvider>
    );
}

function HomeContent() {
    const router = useRouter();
    const [showTutorial, setShowTutorial] = useState(false);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #111827 0%, #1F2937 50%, #374151 100%)',
            padding: '24px',
            fontFamily: '"Courier New", "Monaco", monospace'
        }}>
            <div style={{maxWidth: '1000px', margin: '0 auto'}}>
                {/* Header - Retro Style */}
                <div style={{textAlign: 'center', marginBottom: '48px'}}>
                    <div style={{
                        background: '#1F2937',
                        border: '3px solid #8B5CF6',
                        padding: '32px',
                        marginBottom: '32px',
                        boxShadow: '6px 6px 0px #000000'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: '#8B5CF6',
                            margin: '0 auto 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #000000',
                            boxShadow: '4px 4px 0px #000000'
                        }}>
                            <PlayCircleOutlined style={{fontSize: '32px', color: 'white'}}/>
                        </div>
                        <Title
                            level={1}
                            style={{
                                color: '#F9FAFB',
                                marginBottom: '16px',
                                fontSize: '48px',
                                textTransform: 'uppercase',
                                letterSpacing: '3px'
                            }}
                            className="retro-gradient-text"
                        >
                            QUIZ MASTER
                        </Title>
                        <Text style={{
                            color: '#D1D5DB',
                            fontSize: '18px',
                            textTransform: 'uppercase',
                            letterSpacing: '2px'
                        }}>
                            REAL-TIME MULTIPLAYER QUIZ BATTLES
                        </Text>
                    </div>
                </div>

                {/* Main Actions - Retro Style */}
                <Row gutter={[32, 32]} style={{marginBottom: '48px'}}>
                    <Col xs={24} md={12}>
                        <Card
                            hoverable
                            style={{
                                background: '#1F2937',
                                border: '3px solid #8B5CF6',
                                color: '#F9FAFB',
                                cursor: 'pointer'
                            }}
                            bodyStyle={{padding: '24px', textAlign: 'center'}}
                            onClick={() => router.push('/create')}
                            className="retro-card"
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: '#8B5CF6',
                                margin: '0 auto 20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #000000',
                                boxShadow: '3px 3px 0px #000000'
                            }}>
                                <PlusOutlined style={{fontSize: '24px', color: 'white'}}/>
                            </div>
                            <Title level={2} style={{
                                color: '#F9FAFB',
                                marginBottom: '16px',
                                fontSize: '24px',
                                textTransform: 'uppercase',
                                letterSpacing: '2px'
                            }}>
                                CREATE ROOM
                            </Title>
                            <Text style={{
                                color: '#D1D5DB',
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                display: 'block',
                                marginBottom: '20px'
                            }}>
                                START YOUR OWN QUIZ BATTLE
                            </Text>
                            <Button
                                type="primary"
                                size="large"
                                style={{
                                    background: '#8B5CF6',
                                    borderColor: '#8B5CF6',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    fontWeight: 'bold',
                                    fontSize: '14px'
                                }}
                                className="retro-button"
                                icon={<RocketOutlined/>}
                            >
                                CREATE NOW
                            </Button>
                        </Card>
                    </Col>

                    <Col xs={24} md={12}>
                        <Card
                            hoverable
                            style={{
                                background: '#1F2937',
                                border: '3px solid #06B6D4',
                                color: '#F9FAFB',
                                cursor: 'pointer'
                            }}
                            bodyStyle={{padding: '24px', textAlign: 'center'}}
                            onClick={() => router.push('/join')}
                            className="retro-card"
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: '#06B6D4',
                                margin: '0 auto 20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #000000',
                                boxShadow: '3px 3px 0px #000000'
                            }}>
                                <TeamOutlined style={{fontSize: '24px', color: 'white'}}/>
                            </div>
                            <Title level={2} style={{
                                color: '#F9FAFB',
                                marginBottom: '16px',
                                fontSize: '24px',
                                textTransform: 'uppercase',
                                letterSpacing: '2px'
                            }}>
                                JOIN ROOM
                            </Title>
                            <Text style={{
                                color: '#D1D5DB',
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                display: 'block',
                                marginBottom: '20px'
                            }}>
                                ENTER A ROOM CODE AND BATTLE
                            </Text>
                            <Button
                                type="primary"
                                size="large"
                                style={{
                                    background: '#06B6D4',
                                    borderColor: '#06B6D4',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    fontWeight: 'bold',
                                    fontSize: '14px'
                                }}
                                className="retro-button"
                                icon={<PlayCircleOutlined/>}
                            >
                                JOIN NOW
                            </Button>
                        </Card>
                    </Col>
                </Row>

                {/* Quick Join - Retro Style */}
                <Card
                    style={{
                        background: '#1F2937',
                        border: '3px solid #F97316',
                        color: '#F9FAFB',
                        marginBottom: '48px'
                    }}
                    bodyStyle={{padding: '24px', textAlign: 'center'}}
                    className="retro-card"
                >
                    <div style={{marginBottom: '24px'}}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: '#F97316',
                            margin: '0 auto 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #000000',
                            boxShadow: '3px 3px 0px #000000'
                        }}>
                            <ThunderboltOutlined style={{fontSize: '24px', color: 'white'}}/>
                        </div>
                        <Title level={3} style={{
                            color: '#F9FAFB',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontSize: '18px'
                        }}>
                            QUICK JOIN
                        </Title>
                        <Text style={{
                            color: '#D1D5DB',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            JUMP STRAIGHT INTO THE ACTION
                        </Text>
                    </div>
                    <QuickJoinForm/>
                </Card>

                {/* Features - Enhanced Cartoon Style */}
                <Row gutter={[32, 32]} style={{marginBottom: '48px'}}>
                    <Col xs={24} md={8}>
                        <Card
                            hoverable
                            style={{
                                background: '#1F2937',
                                border: '4px solid #FF6B6B',
                                borderRadius: '24px',
                                textAlign: 'center',
                                height: '100%',
                                boxShadow: '8px 8px 0px #000000',
                                transform: 'rotate(-1deg)',
                                transition: 'all 0.3s ease'
                            }}
                            bodyStyle={{padding: '32px 24px'}}
                            className="cartoon-card"
                        >
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                                margin: '0 auto 24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                border: '4px solid #000000',
                                boxShadow: '4px 4px 0px #000000',
                                transform: 'rotate(5deg)'
                            }}>
                                <ThunderboltOutlined style={{fontSize: '32px', color: 'white'}}/>
                            </div>
                            <Title level={3} style={{
                                color: '#F9FAFB',
                                marginBottom: '16px',
                                fontSize: '24px',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                textShadow: '2px 2px 0px #000000'
                            }}>
                                ⚡ REAL-TIME
                            </Title>
                            <Text style={{
                                color: '#D1D5DB',
                                fontSize: '16px',
                                lineHeight: '1.6',
                                display: 'block',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                LIGHTNING-FAST QUIZ BATTLES WITH INSTANT SCORING! 🏃‍♂️💨
                            </Text>
                        </Card>
                    </Col>

                    <Col xs={24} md={8}>
                        <Card
                            hoverable
                            style={{
                                background: '#1F2937',
                                border: '4px solid #4ECDC4',
                                borderRadius: '24px',
                                textAlign: 'center',
                                height: '100%',
                                boxShadow: '8px 8px 0px #000000',
                                transform: 'rotate(1deg)',
                                transition: 'all 0.3s ease'
                            }}
                            bodyStyle={{padding: '32px 24px'}}
                            className="cartoon-card"
                        >
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, #4ECDC4, #45B7D1)',
                                margin: '0 auto 24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                border: '4px solid #000000',
                                boxShadow: '4px 4px 0px #000000',
                                transform: 'rotate(-3deg)'
                            }}>
                                <TeamOutlined style={{fontSize: '32px', color: 'white'}}/>
                            </div>
                            <Title level={3} style={{
                                color: '#F9FAFB',
                                marginBottom: '16px',
                                fontSize: '24px',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                textShadow: '2px 2px 0px #000000'
                            }}>
                                👥 MULTIPLAYER
                            </Title>
                            <Text style={{
                                color: '#D1D5DB',
                                fontSize: '16px',
                                lineHeight: '1.6',
                                display: 'block',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                UP TO 50 FRIENDS! PERFECT FOR EPIC BATTLES! 🎉👨‍👩‍👧‍👦
                            </Text>
                        </Card>
                    </Col>

                    <Col xs={24} md={8}>
                        <Card
                            hoverable
                            style={{
                                background: '#1F2937',
                                border: '4px solid #FFE66D',
                                borderRadius: '24px',
                                textAlign: 'center',
                                height: '100%',
                                boxShadow: '8px 8px 0px #000000',
                                transform: 'rotate(-0.5deg)',
                                transition: 'all 0.3s ease'
                            }}
                            bodyStyle={{padding: '32px 24px'}}
                            className="cartoon-card"
                        >
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, #FFE66D, #FF8E53)',
                                margin: '0 auto 24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                border: '4px solid #000000',
                                boxShadow: '4px 4px 0px #000000',
                                transform: 'rotate(4deg)'
                            }}>
                                <BulbOutlined style={{fontSize: '32px', color: 'white'}}/>
                            </div>
                            <Title level={3} style={{
                                color: '#F9FAFB',
                                marginBottom: '16px',
                                fontSize: '24px',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                textShadow: '2px 2px 0px #000000'
                            }}>
                                🧠 CATEGORIES
                            </Title>
                            <Text style={{
                                color: '#D1D5DB',
                                fontSize: '16px',
                                lineHeight: '1.6',
                                display: 'block',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                SCIENCE, HISTORY, SPORTS & MORE! TEST YOUR KNOWLEDGE! 📚🔬
                            </Text>
                        </Card>
                    </Col>
                </Row>

                {/* Tutorial and Admin Buttons - Cartoon Style */}
                <div style={{textAlign: 'center', marginBottom: '48px'}}>
                    <Space size="large" wrap>
                        <Button
                            onClick={() => setShowTutorial(true)}
                            size="large"
                            style={{
                                borderRadius: '20px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                height: '48px',
                                minWidth: '140px',
                                background: 'linear-gradient(135deg, #96CEB4, #FFEAA7)',
                                border: 'none',
                                color: '#333'
                            }}
                            icon={<QuestionCircleOutlined/>}
                            className="cartoon-button wiggle-on-hover"
                        >
                            🎮 How to Play
                        </Button>
                        <Button
                            onClick={() => router.push('/admin')}
                            size="large"
                            style={{
                                borderRadius: '20px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                height: '48px',
                                minWidth: '140px',
                                background: 'linear-gradient(135deg, #A29BFE, #FD79A8)',
                                border: 'none',
                                color: 'white'
                            }}
                            icon={<SettingOutlined/>}
                            className="cartoon-button wiggle-on-hover"
                        >
                            ⚙️ Admin Panel
                        </Button>
                    </Space>
                    <div style={{marginTop: '16px'}}>
                        <Text style={{color: '#888', fontSize: '14px'}}>
                            🎯 Use the Admin Panel to manage questions and categories
                        </Text>
                    </div>
                </div>

                {/* Tutorial Modal */}
                {showTutorial && (
                    <TutorialModal onClose={() => setShowTutorial(false)}/>
                )}
            </div>
        </div>
    );
}

function QuickJoinForm() {
    const [roomCode, setRoomCode] = useState('');
    const [playerName, setPlayerName] = useState('');
    const router = useRouter();

    const handleQuickJoin = () => {
        if (roomCode.trim() && playerName.trim()) {
            router.push(`/join?room=${roomCode.toUpperCase()}&name=${encodeURIComponent(playerName)}`);
        }
    };

    return (
        <Space.Compact style={{width: '100%', maxWidth: '500px', margin: '0 auto'}}>
            <Input
                placeholder="🎪 Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                size="large"
                style={{
                    borderRadius: '16px 0 0 16px',
                    fontSize: '16px',
                    height: '48px'
                }}
            />
            <Input
                placeholder="👤 Your Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                size="large"
                style={{
                    borderRadius: '0',
                    fontSize: '16px',
                    height: '48px'
                }}
            />
            <Button
                type="primary"
                onClick={handleQuickJoin}
                disabled={!roomCode.trim() || !playerName.trim()}
                size="large"
                style={{
                    borderRadius: '0 16px 16px 0',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    height: '48px',
                    minWidth: '120px',
                    backgroundColor: '#F97316',
                    borderColor: '#F97316',
                    color: 'white',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}
                icon={<RocketOutlined/>}
                className="cartoon-button wiggle-on-hover"
            >
                GO! 🚀
            </Button>
        </Space.Compact>
    );
}

function TutorialModal({onClose}: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">How to Play</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Create or Join a Room</h3>
                            <p className="text-gray-600">
                                Start by creating a new room or joining an existing one with a room code.
                                You can set a password for private games.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Configure Game Settings</h3>
                            <p className="text-gray-600">
                                The room host can customize the quiz by selecting categories, number of questions,
                                time per question, and scoring rules.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Wait for Players</h3>
                            <p className="text-gray-600">
                                All players must mark themselves as ready before the game can start.
                                You need at least 2 players to begin.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Answer Questions</h3>
                            <p className="text-gray-600">
                                When the game starts, everyone sees the same questions simultaneously.
                                Choose your answer before time runs out!
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">5. Scoring</h3>
                            <p className="text-gray-600">
                                Earn points for correct answers. With time bonus scoring enabled,
                                faster answers earn more points. Watch the live leaderboard!
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">6. Results</h3>
                            <p className="text-gray-600">
                                After all questions, see the final leaderboard and your performance.
                                You can start a new game or return to the main menu.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <button onClick={onClose} className="btn-primary btn-lg">
                            Got it, let's play!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
