# Quiz Master - Real-time Multiplayer Quiz Game

A modern, real-time multiplayer quiz game built with Next.js, Socket.IO, Tailwind CSS, and MySQL. Players can create or join rooms, configure game settings, answer questions, and compete in real-time with friends.

## 🚀 Features

- **Real-time Multiplayer**: Up to 50 players per room with instant synchronization
- **Room Management**: Create password-protected rooms with custom settings
- **Multiple Categories**: Science, History, Sports, Technology, Entertainment, Geography, Literature, and General Knowledge
- **Flexible Scoring**: Base scoring or time-bonus scoring for faster answers
- **Disconnect/Reconnect**: Graceful handling of network interruptions with 30-second reconnect window
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Game Persistence**: Game results and leaderboards saved to MySQL database

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **Database**: MySQL 8+ with mysql2 driver
- **Real-time Communication**: Socket.IO for bidirectional communication
- **Styling**: Tailwind CSS with custom components and animations

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- MySQL 8.0 or higher
- Git

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd socket-gaming
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

1. **Create MySQL Database**:
   ```sql
   CREATE DATABASE quiz_game;
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database credentials:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_NAME=quiz_game

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Security (Change in production!)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   BCRYPT_ROUNDS=12

   # Game Configuration
   RECONNECT_TIMEOUT_MS=30000
   ROOM_CLEANUP_INTERVAL_MS=300000
   MAX_ROOMS_PER_IP=5
   ```

### 4. Initialize Database & Seed Questions

The application will automatically create the required tables on first run. To seed sample questions:

```bash
npx ts-node lib/seed-questions.ts
```

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🎮 How to Play

### Creating a Room
1. Click "Create Room" on the home page
2. Fill in room details (name, max players, optional password)
3. Configure game settings (categories, questions, time limits, scoring)
4. Share the room code with friends

### Joining a Room
1. Click "Join Room" or use the quick join form
2. Enter the 6-character room code
3. Enter your name and password (if required)
4. Wait for the host to start the game

### Game Flow
1. **Lobby**: Players join and mark themselves as ready
2. **Game**: Answer questions within the time limit
3. **Results**: View final leaderboard and game statistics

## 🏗 Project Structure

```
socket-gaming/
├── app/                    # Next.js App Router pages
│   ├── create/            # Create room page
│   ├── join/              # Join room page
│   ├── room/[roomId]/     # Game room (lobby + game)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable UI components
│   ├── ConnectionStatus.tsx
│   └── NotificationToast.tsx
├── lib/                   # Core application logic
│   ├── db-config.ts       # Database configuration
│   ├── game-logic.ts      # Game state management
│   ├── room-manager.ts    # Room state management
│   ├── seed-questions.ts  # Sample questions
│   ├── socket-client.tsx  # Socket.IO client context
│   └── socket-server.ts   # Socket.IO server
├── types/                 # TypeScript type definitions
│   └── game.ts
├── server.js              # Custom Next.js server with Socket.IO
└── package.json
```

## 🔌 Socket.IO Events

### Client → Server
- `create_room`: Create a new game room
- `join_room`: Join an existing room
- `reconnect_room`: Reconnect to a room after disconnect
- `set_ready`: Toggle player ready status
- `update_settings`: Update game settings (host only)
- `start_game`: Start the game (host only)
- `answer`: Submit an answer to a question
- `leave_room`: Leave the current room

### Server → Client
- `room_created`: Room successfully created
- `joined_room`: Successfully joined a room
- `game_started`: Game has begun
- `new_question`: New question available
- `timer_tick`: Timer countdown update
- `answer_received`: Answer submission confirmed
- `round_results`: Results after each question
- `game_over`: Final game results
- `player_joined/left/updated`: Player state changes

## 🗄 Database Schema

### Questions Table
```sql
CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(255) NOT NULL,
  question_text TEXT NOT NULL,
  choice_a VARCHAR(255) NOT NULL,
  choice_b VARCHAR(255) NOT NULL,
  choice_c VARCHAR(255) NOT NULL,
  choice_d VARCHAR(255) NOT NULL,
  correct_choice ENUM('A','B','C','D') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Games Table
```sql
CREATE TABLE games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_name VARCHAR(255),
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Game Results Table
```sql
CREATE TABLE game_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT,
  player_name VARCHAR(255),
  score INT,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);
```

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production` in your environment
2. Update database credentials for production
3. Change JWT_SECRET to a secure random string
4. Configure proper CORS origins in socket-server.ts

### Build & Start
```bash
npm run build
npm start
```

### Recommended Hosting
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Heroku, DigitalOcean
- **Database**: PlanetScale, AWS RDS, Google Cloud SQL

## 🧪 Testing

### Manual Testing Checklist
- [ ] Create room with various settings
- [ ] Join room with and without password
- [ ] Player ready/unready functionality
- [ ] Game start with minimum 2 players
- [ ] Question display and timer
- [ ] Answer submission and scoring
- [ ] Disconnect/reconnect during game
- [ ] Final results and leaderboard
- [ ] Database persistence of game results

### Automated Tests (Future Enhancement)
```bash
npm test        # Unit tests
npm run test:e2e # End-to-end tests
```

## 🔧 Configuration Options

### Game Settings
- **Categories**: Select from 8 different question categories
- **Question Count**: 5, 10, 15, 20, or 25 questions
- **Time Limit**: 10-60 seconds per question
- **Scoring**: Base (100 points) or Time Bonus (up to 200 points)
- **Answer Shuffling**: Randomize answer order

### Server Settings
- **Reconnect Timeout**: How long to wait for disconnected players
- **Room Cleanup**: Automatic cleanup of inactive rooms
- **Rate Limiting**: Prevent spam and abuse

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Socket.IO Connection Failed**
   - Check if port 3000 is available
   - Verify firewall settings
   - Try different browser or incognito mode

3. **Questions Not Loading**
   - Run the seed script: `npx ts-node lib/seed-questions.ts`
   - Check database has questions in the selected categories

4. **TypeScript Errors**
   - Run `npx tsc --noEmit` to check for type errors
   - Ensure all dependencies are installed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- Next.js team for the amazing framework
- Tailwind CSS for beautiful styling
- MySQL for reliable data persistence

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the GitHub issues
3. Create a new issue with detailed information

---

**Happy Quizzing! 🎯**
