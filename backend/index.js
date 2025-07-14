require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { User, Lobby } = require('./models');

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = [
  'https://yegna-bingo-7fp5.vercel.app',
  'http://localhost:5173',
];

function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  console.error('Blocked by CORS:', origin);
  return callback(new Error('Not allowed by CORS: ' + origin), false);
}

// CORS middleware (must be before bodyParser and routes)
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// Preflight handler for all routes
app.options('*', cors({
  origin: corsOrigin,
  credentials: true,
}));

// CORS error handler
app.use(function(err, req, res, next) {
  if (err.message && err.message.startsWith('Not allowed by CORS')) {
    return res.status(403).json({ error: err.message });
  }
  next(err);
});

app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Example endpoint
app.get('/', (req, res) => {
  res.send('Yegna Bingo backend is running!');
});

// Register user
app.post('/register', async (req, res) => {
  const { telegramId, name, phone } = req.body;
  if (!telegramId || !name || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    let user = await User.findOne({ telegramId });
    if (user) {
      return res.status(400).json({ error: 'User already registered' });
    }
    user = new User({ telegramId, name, phone });
    await user.save();
    res.json({ message: 'User registered', user });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get wallet balance
app.get('/wallet/:telegramId', async (req, res) => {
  const { telegramId } = req.params;
  try {
    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

// Join lobby
app.post('/lobby/join', async (req, res) => {
  const { telegramId, bet } = req.body;
  if (!telegramId || !bet) return res.status(400).json({ error: 'Missing fields' });
  try {
    let user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.balance < bet) return res.status(400).json({ error: 'Insufficient balance' });
    let lobby = await Lobby.findOne({ bet, started: false });
    if (!lobby) {
      lobby = new Lobby({ bet, players: [], started: false, assignedCards: {}, calledNumbers: [], winner: null });
      await lobby.save();
    }
    if (lobby.players.includes(telegramId)) {
      return res.status(400).json({ error: 'Already in lobby' });
    }
    lobby.players.push(telegramId);
    await lobby.save();
    res.json({ message: 'Joined lobby', lobby });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join lobby' });
  }
});

// Get lobby status
app.get('/lobby/status/:bet', async (req, res) => {
  const { bet } = req.params;
  try {
    const lobby = await Lobby.findOne({ bet, started: false });
    if (!lobby) return res.json({ players: 0, potentialWinnings: 0 });
    res.json({
      players: lobby.players.length,
      potentialWinnings: (lobby.bet * lobby.players.length * 0.8).toFixed(2),
      lobby
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get lobby status' });
  }
});

// Get available cards in lobby (1-100, not assigned)
app.get('/lobby/cards/:bet', async (req, res) => {
  const { bet } = req.params;
  try {
    const lobby = await Lobby.findOne({ bet, started: false });
    if (!lobby) return res.json({ available: Array.from({ length: 100 }, (_, i) => i + 1) });
    const assigned = Array.from(lobby.assignedCards.values());
    const available = Array.from({ length: 100 }, (_, i) => i + 1).filter(num => !assigned.includes(num));
    res.json({ available });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get cards' });
  }
});

// Assign card to user in lobby
app.post('/lobby/assign_card', async (req, res) => {
  const { telegramId, bet, card } = req.body;
  if (!telegramId || !bet || !card) return res.status(400).json({ error: 'Missing fields' });
  try {
    const lobby = await Lobby.findOne({ bet, started: false });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    if (Array.from(lobby.assignedCards.values()).includes(card)) {
      return res.status(400).json({ error: 'Card already taken' });
    }
    lobby.assignedCards.set(telegramId, card);
    await lobby.save();
    res.json({ message: 'Card assigned', card });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign card' });
  }
});

// Leave lobby
app.post('/lobby/leave', async (req, res) => {
  const { telegramId, bet } = req.body;
  if (!telegramId || !bet) return res.status(400).json({ error: 'Missing fields' });
  try {
    const lobby = await Lobby.findOne({ bet, started: false });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    lobby.players = lobby.players.filter(id => id !== telegramId);
    lobby.assignedCards.delete(telegramId);
    await lobby.save();
    res.json({ message: 'Left lobby' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to leave lobby' });
  }
});

// Start game (admin function - can be triggered when enough players join)
app.post('/game/start/:bet', async (req, res) => {
  const { bet } = req.params;
  try {
    const lobby = await Lobby.findOne({ bet, started: false });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    if (lobby.players.length < 2) return res.status(400).json({ error: 'Need at least 2 players' });
    
    lobby.started = true;
    lobby.calledNumbers = [];
    lobby.winner = null;
    await lobby.save();
    
    res.json({ message: 'Game started', lobby });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Get game status
app.get('/game/status/:bet', async (req, res) => {
  const { bet } = req.params;
  try {
    const lobby = await Lobby.findOne({ bet });
    if (!lobby) return res.status(404).json({ error: 'Game not found' });
    
    res.json({
      gameStarted: lobby.started,
      calledNumbers: lobby.calledNumbers || [],
      winner: lobby.winner,
      players: lobby.players.length,
      assignedCards: Object.fromEntries(lobby.assignedCards)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get game status' });
  }
});

// Call next number (admin function)
app.post('/game/call/:bet', async (req, res) => {
  const { bet } = req.params;
  try {
    const lobby = await Lobby.findOne({ bet, started: true });
    if (!lobby) return res.status(404).json({ error: 'Game not found or not started' });
    
    // Generate next number
    const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
    const remaining = allNumbers.filter(n => !lobby.calledNumbers.includes(n));
    if (remaining.length === 0) return res.status(400).json({ error: 'All numbers called' });
    
    const nextNumber = remaining[Math.floor(Math.random() * remaining.length)];
    lobby.calledNumbers.push(nextNumber);
    
    // Check for winners
    const winner = await checkForWinner(lobby);
    if (winner) {
      lobby.winner = winner;
      // Update winner's balance
      const user = await User.findOne({ telegramId: winner });
      if (user) {
        const winnings = lobby.bet * lobby.players.length * 0.8;
        user.balance += winnings;
        await user.save();
      }
    }
    
    await lobby.save();
    res.json({ 
      calledNumber: nextNumber, 
      calledNumbers: lobby.calledNumbers,
      winner: lobby.winner 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to call number' });
  }
});

// Helper function to check for winner
async function checkForWinner(lobby) {
  const { getCardNumbers, getBingoWinCells } = require('./bingoGameLogic');
  
  for (const [telegramId, cardId] of lobby.assignedCards) {
    const card = getCardNumbers(cardId);
    const winCells = getBingoWinCells(card, lobby.calledNumbers);
    if (winCells) {
      return telegramId;
    }
  }
  return null;
}

// Auto-start games when enough players join (optional)
app.post('/lobby/auto-start/:bet', async (req, res) => {
  const { bet } = req.params;
  try {
    const lobby = await Lobby.findOne({ bet, started: false });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    
    if (lobby.players.length >= 2) {
      lobby.started = true;
      lobby.calledNumbers = [];
      lobby.winner = null;
      await lobby.save();
      res.json({ message: 'Game auto-started', lobby });
    } else {
      res.json({ message: 'Not enough players yet', players: lobby.players.length });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to auto-start game' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Yegna Bingo backend listening on port ${PORT}`);
});