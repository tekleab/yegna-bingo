const mongoose = require('mongoose');

// User schema
const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  balance: { type: Number, default: 10 },
});

// Lobby schema
const lobbySchema = new mongoose.Schema({
  bet: { type: Number, required: true },
  players: [{ type: String }], // Array of telegramIds
  started: { type: Boolean, default: false },
  assignedCards: { type: Map, of: Number, default: {} }, // telegramId -> cardNumber
  calledNumbers: [{ type: Number, default: [] }],
  winner: { type: String, default: null },
});

const User = mongoose.model('User', userSchema);
const Lobby = mongoose.model('Lobby', lobbySchema);

module.exports = { User, Lobby }; 