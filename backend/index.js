require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

console.log('DEBUG MONGODB_URI:', process.env.MONGODB_URI);

const { User, Lobby } = require('./models');

// Remove in-memory lobbies
const lobbyBets = [10, 20, 50, 100]; // keep for validation
// const lobbies = {};
// lobbyBets.forEach(bet => { ... });

// Helper: find or create lobby by bet
async function getOrCreateLobby(bet) {
  let lobby = await Lobby.findOne({ bet });
  if (!lobby) {
    lobby = new Lobby({ bet, players: [], started: false, assignedCards: {}, calledNumbers: [], winner: null });
    await lobby.save();
  }
  return lobby;
}

app.get('/', (req, res) => {
  res.send('Yegna Bingo backend is running!');
});

// Register a new user
app.post('/register', async (req, res) => {
  const { telegramId, name, phone } = req.body;
  if (!telegramId || !name || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const existing = await User.findOne({ telegramId });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const user = new User({ telegramId, name, phone });
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get user info
app.get('/user/:telegramId', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get wallet balance
app.get('/wallet/:telegramId', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Join a lobby
app.post('/lobby/join', async (req, res) => {
  const { telegramId, bet } = req.body;
  if (!telegramId || !lobbyBets.includes(bet)) {
    return res.status(400).json({ error: 'Invalid telegramId or bet' });
  }
  try {
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.balance < bet) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    const lobby = await getOrCreateLobby(bet);
    if (lobby.players.includes(telegramId)) {
      return res.status(409).json({ error: 'Already in lobby' });
    }
    lobby.players.push(telegramId);
    await lobby.save();
    res.json({ success: true, players: lobby.players.length });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get lobby status
app.get('/lobby/status/:bet', async (req, res) => {
  const bet = parseInt(req.params.bet, 10);
  if (!lobbyBets.includes(bet)) {
    return res.status(400).json({ error: 'Invalid bet' });
  }
  try {
    const lobby = await getOrCreateLobby(bet);
    res.json({ players: lobby.players.length, potentialWinnings: lobby.players.length * bet });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get available cards for a lobby
app.get('/lobby/cards/:bet', async (req, res) => {
  const bet = parseInt(req.params.bet, 10);
  if (!lobbyBets.includes(bet)) {
    return res.status(400).json({ error: 'Invalid bet' });
  }
  try {
    const lobby = await getOrCreateLobby(bet);
    const allCards = Array.from({ length: 100 }, (_, i) => i + 1);
    const taken = Array.from(lobby.assignedCards.values());
    const available = allCards.filter(card => !taken.includes(card));
    res.json({ available });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Assign a card to a user in a lobby
app.post('/lobby/assign_card', async (req, res) => {
  const { telegramId, bet, card } = req.body;
  if (!telegramId || !lobbyBets.includes(bet) || !card || card < 1 || card > 100) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  try {
    const lobby = await getOrCreateLobby(bet);
    if (!lobby.players.includes(telegramId)) {
      return res.status(400).json({ error: 'User not in lobby' });
    }
    if (Array.from(lobby.assignedCards.values()).includes(card)) {
      return res.status(409).json({ error: 'Card already taken' });
    }
    lobby.assignedCards.set(telegramId, card);
    await lobby.save();
    res.json({ success: true, card });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Leave a lobby
app.post('/lobby/leave', async (req, res) => {
  const { telegramId, bet } = req.body;
  if (!telegramId || !lobbyBets.includes(bet)) {
    return res.status(400).json({ error: 'Invalid telegramId or bet' });
  }
  try {
    const lobby = await getOrCreateLobby(bet);
    const playerIndex = lobby.players.indexOf(telegramId);
    if (playerIndex === -1) {
      return res.status(404).json({ error: 'User not in lobby' });
    }
    lobby.players.splice(playerIndex, 1);
    lobby.assignedCards.delete(telegramId);
    await lobby.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Start a game in a lobby
app.post('/lobby/start', async (req, res) => {
  const { bet } = req.body;
  if (!lobbyBets.includes(bet)) {
    return res.status(400).json({ error: 'Invalid bet' });
  }
  try {
    const lobby = await getOrCreateLobby(bet);
    if (lobby.started) {
      return res.status(409).json({ error: 'Game already started' });
    }
    lobby.started = true;
    lobby.calledNumbers = [];
    lobby.winner = null;
    await lobby.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Call next number in a lobby
app.post('/lobby/call_number', async (req, res) => {
  const { bet } = req.body;
  if (!lobbyBets.includes(bet)) {
    return res.status(400).json({ error: 'Invalid bet' });
  }
  try {
    const lobby = await getOrCreateLobby(bet);
    if (!lobby.started) {
      return res.status(400).json({ error: 'Game not started' });
    }
    const ALL_NUMBERS = Array.from({ length: 75 }, (_, i) => i + 1);
    const remaining = ALL_NUMBERS.filter(n => !lobby.calledNumbers.includes(n));
    if (remaining.length === 0) {
      return res.status(400).json({ error: 'All numbers called' });
    }
    const next = remaining[Math.floor(Math.random() * remaining.length)];
    lobby.calledNumbers.push(next);
    await lobby.save();
    res.json({ next, calledNumbers: lobby.calledNumbers });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get game state for a lobby
app.get('/lobby/game_state/:bet', async (req, res) => {
  const bet = parseInt(req.params.bet, 10);
  if (!lobbyBets.includes(bet)) {
    return res.status(400).json({ error: 'Invalid bet' });
  }
  try {
    const lobby = await getOrCreateLobby(bet);
    res.json({
      started: lobby.started,
      players: lobby.players,
      assignedCards: Object.fromEntries(lobby.assignedCards),
      calledNumbers: lobby.calledNumbers,
      winner: lobby.winner,
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Reset a game in a lobby
app.post('/lobby/reset', (req, res) => {
  const { bet } = req.body;
  if (!lobbyBets.includes(bet)) {
    return res.status(400).json({ error: 'Invalid bet' });
  }
  const lobby = lobbies[bet];
  lobby.started = false;
  lobby.calledNumbers = [];
  lobby.winner = null;
  res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Yegna Bingo backend listening on port ${PORT}`);
}); 