const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// In-memory user store
const users = {};

// In-memory lobbies by bet amount
const lobbyBets = [10, 20, 50, 100];
const lobbies = {};
lobbyBets.forEach(bet => {
  lobbies[bet] = {
    players: [],
    started: false,
    assignedCards: {}, // telegramId -> cardNumber
    calledNumbers: [], // Numbers called in this game
    winner: null,      // telegramId of winner
  };
});

app.get('/', (req, res) => {
  res.send('Yegna Bingo backend is running!');
});

// Register a new user
app.post('/register', (req, res) => {
  const { telegramId, name, phone } = req.body;
  if (!telegramId || !name || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (users[telegramId]) {
    return res.status(409).json({ error: 'User already exists' });
  }
  users[telegramId] = {
    telegramId,
    name,
    phone,
    balance: 10, // Default starting balance is now 10 Birr
  };
  res.json({ success: true, user: users[telegramId] });
});

// Get user info
app.get('/user/:telegramId', (req, res) => {
  const user = users[req.params.telegramId];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Get wallet balance
app.get('/wallet/:telegramId', (req, res) => {
  const user = users[req.params.telegramId];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ balance: user.balance });
});

// Join a lobby
app.post('/lobby/join', (req, res) => {
  const { telegramId, bet } = req.body;
  if (!telegramId || !lobbyBets.includes(bet)) {
    return res.status(400).json({ error: 'Invalid telegramId or bet' });
  }
  const user = users[telegramId];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (user.balance < bet) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  const lobby = lobbies[bet];
  if (lobby.players.includes(telegramId)) {
    return res.status(409).json({ error: 'Already in lobby' });
  }
  lobby.players.push(telegramId);
  res.json({ success: true, players: lobby.players.length });
});

// Get lobby status
app.get('/lobby/status/:bet', (req, res) => {
  const bet = parseInt(req.params.bet, 10);
  if (!lobbyBets.includes(bet)) {
    return res.status(400).json({ error: 'Invalid bet' });
  }
  const lobby = lobbies[bet];
  res.json({ players: lobby.players.length, potentialWinnings: lobby.players.length * bet });
});

// Get available cards for a lobby
app.get('/lobby/cards/:bet', (req, res) => {
  const bet = parseInt(req.params.bet, 10);
  if (!lobbyBets.includes(bet)) {
    return res.status(400).json({ error: 'Invalid bet' });
  }
  const lobby = lobbies[bet];
  const allCards = Array.from({ length: 100 }, (_, i) => i + 1);
  const taken = Object.values(lobby.assignedCards);
  const available = allCards.filter(card => !taken.includes(card));
  res.json({ available });
});

// Assign a card to a user in a lobby
app.post('/lobby/assign_card', (req, res) => {
  const { telegramId, bet, card } = req.body;
  if (!telegramId || !lobbyBets.includes(bet) || !card || card < 1 || card > 100) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  const lobby = lobbies[bet];
  if (!lobby.players.includes(telegramId)) {
    return res.status(400).json({ error: 'User not in lobby' });
  }
  if (Object.values(lobby.assignedCards).includes(card)) {
    return res.status(409).json({ error: 'Card already taken' });
  }
  lobby.assignedCards[telegramId] = card;
  res.json({ success: true, card });
});

// Leave a lobby
app.post('/lobby/leave', (req, res) => {
  const { telegramId, bet } = req.body;
  if (!telegramId || !lobbyBets.includes(bet)) {
    return res.status(400).json({ error: 'Invalid telegramId or bet' });
  }
  const lobby = lobbies[bet];
  const playerIndex = lobby.players.indexOf(telegramId);
  if (playerIndex === -1) {
    return res.status(404).json({ error: 'User not in lobby' });
  }
  // Remove player from lobby
  lobby.players.splice(playerIndex, 1);
  // Remove assigned card if any
  if (lobby.assignedCards[telegramId]) {
    delete lobby.assignedCards[telegramId];
  }
  res.json({ success: true });
});

// Start a game in a lobby
app.post('/lobby/start', (req, res) => {
  const { bet } = req.body;
  if (!lobbyBets.includes(bet)) {
    return res.status(400).json({ error: 'Invalid bet' });
  }
  const lobby = lobbies[bet];
  if (lobby.started) {
    return res.status(409).json({ error: 'Game already started' });
  }
  lobby.started = true;
  lobby.calledNumbers = [];
  lobby.winner = null;
  res.json({ success: true });
});

// Call next number in a lobby
app.post('/lobby/call_number', (req, res) => {
  const { bet } = req.body;
  if (!lobbyBets.includes(bet)) {
    return res.status(400).json({ error: 'Invalid bet' });
  }
  const lobby = lobbies[bet];
  if (!lobby.started) {
    return res.status(400).json({ error: 'Game not started' });
  }
  // Get all possible numbers
  const ALL_NUMBERS = Array.from({ length: 75 }, (_, i) => i + 1);
  const remaining = ALL_NUMBERS.filter(n => !lobby.calledNumbers.includes(n));
  if (remaining.length === 0) {
    return res.status(400).json({ error: 'All numbers called' });
  }
  const next = remaining[Math.floor(Math.random() * remaining.length)];
  lobby.calledNumbers.push(next);
  res.json({ next, calledNumbers: lobby.calledNumbers });
});

// Get game state for a lobby
app.get('/lobby/game_state/:bet', (req, res) => {
  const bet = parseInt(req.params.bet, 10);
  if (!lobbyBets.includes(bet)) {
    return res.status(400).json({ error: 'Invalid bet' });
  }
  const lobby = lobbies[bet];
  res.json({
    started: lobby.started,
    players: lobby.players,
    assignedCards: lobby.assignedCards,
    calledNumbers: lobby.calledNumbers,
    winner: lobby.winner,
  });
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

app.listen(PORT, () => {
  console.log(`Yegna Bingo backend listening on port ${PORT}`);
}); 