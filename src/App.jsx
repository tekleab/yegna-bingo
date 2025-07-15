import React, { useState, useEffect, useRef } from 'react';
import BingoCard from './components/BingoCard'
import NumberCaller from './components/NumberCaller'
import './App.css'
import { getCardNumbers, assignCard, callNextNumber, getBingoWinCells } from './bingoGameLogic';
import YegnaBingoLogo from './assets/YegnaBingoLogo.svg';
import Lobby from './components/Lobby';
import CardSelection from './components/CardSelection';
import axios from 'axios';

const BACKEND_URL = 'https://yegna-bingo.onrender.com';

function RegistrationModal({ onRegister }) {
  const [telegramId, setTelegramId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!telegramId || !name || !phone) {
      setError('All fields are required.');
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/register`, { telegramId, name, phone });
      onRegister({ telegramId, name, phone });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 4px 24px #0004', minWidth: 320 }}>
        <h2 style={{ marginBottom: 18 }}>Register to Play</h2>
        <input type="text" placeholder="Telegram ID" value={telegramId} onChange={e => setTelegramId(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        <input type="text" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: 10, borderRadius: 6, background: '#43a047', color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' }}>Register</button>
      </form>
    </div>
  );
}

// Helper to generate a bingo card
function generateBingoCard() {
  const card = []
  const ranges = [
    [1, 15],   // B
    [16, 30],  // I
    [31, 45],  // N
    [46, 60],  // G
    [61, 75],  // O
  ]
  for (let col = 0; col < 5; col++) {
    const nums = Array.from({ length: 15 }, (_, i) => i + ranges[col][0])
    for (let i = nums.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    for (let row = 0; row < 5; row++) {
      if (!card[row]) card[row] = []
      card[row][col] = nums[row]
    }
  }
  card[2][2] = 'FREE'
  return card
}

function getInitialMarked() {
  return Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) => r === 2 && c === 2)
  )
}

function checkBingo(marked) {
  // Check rows, columns, and diagonals
  for (let i = 0; i < 5; i++) {
    if (marked[i].every(Boolean)) return { type: 'row', index: i };
    if (marked.map(row => row[i]).every(Boolean)) return { type: 'col', index: i };
  }
  if ([0,1,2,3,4].every(i => marked[i][i])) return { type: 'diag', dir: 'main' };
  if ([0,1,2,3,4].every(i => marked[i][4-i])) return { type: 'diag', dir: 'anti' };
  return null;
}

// Bingo column ranges
const B_RANGE = Array.from({length:15},(_,i)=>i+1);
const I_RANGE = Array.from({length:15},(_,i)=>i+16);
const N_RANGE = Array.from({length:15},(_,i)=>i+31);
const G_RANGE = Array.from({length:15},(_,i)=>i+46);
const O_RANGE = Array.from({length:15},(_,i)=>i+61);
const BINGO_RANGES = [B_RANGE, I_RANGE, N_RANGE, G_RANGE, O_RANGE];
const BINGO_LETTERS = ['B','I','N','G','O'];
const ALL_NUMBERS = [...B_RANGE, ...I_RANGE, ...N_RANGE, ...G_RANGE, ...O_RANGE];

// Generate a 5x5 card with correct column ranges
function getCartelaCard(seed) {
  // Use seed to shuffle for deterministic card
  function seededShuffle(arr, seed) {
    let a = arr.slice();
    let s = seed;
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // For each column, pick 5 numbers (middle N is free)
  const card = [];
  for (let col = 0; col < 5; col++) {
    let nums = seededShuffle(BINGO_RANGES[col], (seed+col)*31).slice(0,5);
    card.push(nums);
  }
  // Set center free
  card[2][2] = 'FREE';
  // Transpose to get rows
  return Array.from({length:5},(_,row)=>card.map(col=>col[row]));
}

// Get BINGO letter for a number
function getBingoLetter(num) {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return '';
}

// Amharic numbers 1-75
const amharicNumbers = [
  '', 'አንድ', 'ሁለት', 'ሶስት', 'አራት', 'አምስት', 'ስድስት', 'ሰባት', 'ስምንት', 'ዘጠኝ', 'አስር',
  'አስራ አንድ', 'አስራ ሁለት', 'አስራ ሶስት', 'አስራ አራት', 'አስራ አምስት',
  'አስራ ስድስት', 'አስራ ሰባት', 'አስራ ስምንት', 'አስራ ዘጠኝ', 'ሃያ',
  'ሃያ አንድ', 'ሃያ ሁለት', 'ሃያ ሶስት', 'ሃያ አራት', 'ሃያ አምስት',
  'ሃያ ስድስት', 'ሃያ ሰባት', 'ሃያ ስምንት', 'ሃያ ዘጠኝ', 'ሰላሳ',
  'ሰላሳ አንድ', 'ሰላሳ ሁለት', 'ሰላሳ ሶስት', 'ሰላሳ አራት', 'ሰላሳ አምስት',
  'ሰላሳ ስድስት', 'ሰላሳ ሰባት', 'ሰላሳ ስምንት', 'ሰላሳ ዘጠኝ', 'አርባ',
  'አርባ አንድ', 'አርባ ሁለት', 'አርባ ሶስት', 'አርባ አራት', 'አርባ አምስት',
  'አርባ ስድስት', 'አርባ ሰባት', 'አርባ ስምንት', 'አርባ ዘጠኝ', 'ሃምሳ',
  'ሃምሳ አንድ', 'ሃምሳ ሁለት', 'ሃምሳ ሶስት', 'ሃምሳ አራት', 'ሃምሳ አምስት',
  'ሃምሳ ስድስት', 'ሃምሳ ሰባት', 'ሃምሳ ስምንት', 'ሃምሳ ዘጠኝ', 'ስልሳ',
  'ስልሳ አንድ', 'ስልሳ ሁለት', 'ስልሳ ሶስት', 'ስልሳ አራት', 'ስልሳ አምስት',
  'ስልሳ ስድስት', 'ስልሳ ሰባት', 'ስልሳ ስምንት', 'ስልሳ ዘጠኝ', 'ሰባ',
  'ሰባ አንድ', 'ሰባ ሁለት', 'ሰባ ሶስት', 'ሰባ አራት', 'ሰባ አምስት',
  'ሰባ ስድስት', 'ሰባ ሰባት', 'ሰባ ስምንት', 'ሰባ ዘጠኝ', 'ሰባ አስር',
];

function speakAmharicNumber(num, muted) {
  if (muted) return;
  if (!window.speechSynthesis) return;
  const letter = getBingoLetter(num);
  const text = (letter ? letter + '- ' : '') + (amharicNumbers[num] || num.toString());
  const utter = new window.SpeechSynthesisUtterance(text);
  utter.lang = 'am-ET';
  utter.rate = 0.9;
  window.speechSynthesis.cancel(); // Stop any previous speech
  window.speechSynthesis.speak(utter);
}

// Mock API simulation (replace with real API later)
function mockApiAssignCard(lockedCardIds) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(assignCard(lockedCardIds));
    }, 300);
  });
}
function mockApiCallNextNumber(calledNumbers) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(callNextNumber(calledNumbers));
    }, 500);
  });
}
function mockApiCheckWin(card, calledNumbers) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(getBingoWinCells(card, calledNumbers));
    }, 200);
  });
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('yegnaUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [wallet, setWallet] = useState(null);
  const [playerCounts, setPlayerCounts] = useState({});
  const [stage, setStage] = useState('lobby'); // 'lobby', 'card', 'game'
  const [selectedBet, setSelectedBet] = useState(null);
  const [takenCards, setTakenCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Registration handler
  const handleRegister = (userInfo) => {
    setUser(userInfo);
    localStorage.setItem('yegnaUser', JSON.stringify(userInfo));
  };

  // Fetch wallet and lobby status on login
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError('');
    axios.get(`${BACKEND_URL}/wallet/${user?.telegramId}`)
      .then(res => setWallet(res.data.balance))
      .catch(() => setWallet(null));
    // Fetch all lobbies
    Promise.all([10, 20, 25, 50, 100].map(bet =>
      axios.get(`${BACKEND_URL}/lobby/status/${bet}`)
        .then(res => [bet, res.data.players])
        .catch(() => [bet, 0])
    )).then(results => {
      const counts = {};
      results.forEach(([bet, count]) => { counts[bet] = count; });
      setPlayerCounts(counts);
      setLoading(false);
    });
  }, [user]);

  // Join lobby
  const handleJoinLobby = async (bet) => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/lobby/join`, { telegramId: user?.telegramId, bet });
      // Fetch taken cards
      const res = await axios.get(`${BACKEND_URL}/lobby/cards/${bet}`);
      setTakenCards(Array.from({ length: 100 }, (_, i) => i + 1).filter(num => !res.data.available.includes(num)));
      setSelectedBet(bet);
      setStage('card');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join lobby.');
    }
    setLoading(false);
  };

  // Assign card
  const handleAssignCard = async (cardNum) => {
    if (!user || !selectedBet) return;
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/lobby/assign_card`, { telegramId: user?.telegramId, bet: selectedBet, card: cardNum });
      setSelectedCard(cardNum);
      setStage('game');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign card.');
    }
    setLoading(false);
  };

  // UI rendering
  if (!user) {
    return <RegistrationModal onRegister={handleRegister} />;
  }
  if (loading) {
    return <div style={{ color: '#1976d2', fontWeight: 700, fontSize: 22, marginTop: 80 }}>Loading...</div>;
  }
  if (stage === 'lobby') {
    return (
      <div>
        <h1>Yegna Bingo</h1>
        <div style={{ marginBottom: 16 }}>Wallet: <b>{wallet !== null ? `${wallet} Birr` : '...'}</b></div>
        {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
        <Lobby playerCounts={playerCounts} onJoin={handleJoinLobby} />
      </div>
    );
  }
  if (stage === 'card') {
    return (
      <div>
        <h1>Select Your Card</h1>
        {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
        <CardSelection takenCards={takenCards} onPlay={handleAssignCard} />
        <button onClick={() => setStage('lobby')} style={{ marginTop: 16, background: '#e53935', color: '#fff', padding: '10px 24px', borderRadius: 6, border: 'none', fontWeight: 700, cursor: 'pointer' }}>Leave Lobby</button>
      </div>
    );
  }
  if (stage === 'game') {
    return (
      <div className="bingo-app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#18222b', position: 'relative', paddingBottom: 80 }}>
        {/* Header */}
        <div className="bingo-header-bar" style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '0.7rem 0.5rem 0 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={YegnaBingoLogo} alt="Yegna Bingo" style={{ height: 36, marginRight: 8 }} />
          <div className="bingo-title" style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>Yegna Bingo</div>
          <div style={{ fontSize: 14, color: '#ffe066', fontWeight: 700 }}>{calledNumbers.length}/75</div>
        </div>

        {/* Status Bar */}
        <div className="bingo-status-bar" style={{ width: '100%', maxWidth: 420, margin: '0 auto', marginTop: 6, marginBottom: 6, fontWeight: 700, fontSize: 16, color: '#fff', textAlign: 'center' }}>
          {gameWinner ?
            (gameWinner === user.telegramId ? '🎉 YOU WON! 🎉' : 'Game Over - Someone Won!') :
            gameStarted ? '🎮 Game in Progress' : '⏳ Waiting for players...'}
        </div>

        {/* Info Bar */}
        <div className="bingo-info-bar" style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
          <div className="bingo-info-box" style={{ background: '#232c3a', color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 700 }}>Card #{selectedCard}</div>
          <div className="bingo-info-box" style={{ background: '#232c3a', color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 700 }}>{selectedBet} Birr</div>
        </div>

        {/* Called Numbers - horizontally scrollable */}
        <div className="called-balls-container" style={{ width: '100%', maxWidth: 420, margin: '0 auto', marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: '#7ee7e7', fontWeight: 700, marginBottom: 2 }}>Called Numbers</div>
          <div className="called-balls" style={{ display: 'flex', overflowX: 'auto', gap: 6, padding: '4px 0', scrollbarWidth: 'none' }}>
            {calledNumbers.map(num => (
              <div key={num} className="called-ball" style={{ minWidth: 32, height: 32, borderRadius: 16, background: '#ffe066', color: '#b07d00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, border: '2px solid #fff', boxShadow: '0 1px 4px #0002' }}>{num}</div>
            ))}
          </div>
        </div>

        {/* Bingo Card */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 420, margin: '0 auto' }}>
          {bingoCard && marked && (
            <BingoCard
              card={bingoCard}
              marked={marked}
              onMark={handleMarkCell}
              calledNumbers={calledNumbers}
              winningCells={winningCells}
            />
          )}
        </div>

        {/* Button Row - fixed at bottom */}
        <div className="bingo-btn-row" style={{ position: 'fixed', left: 0, bottom: 0, width: '100vw', maxWidth: 420, margin: '0 auto', background: '#18222b', zIndex: 100, display: 'flex', justifyContent: 'center', gap: 10, padding: '12px 0', borderTop: '1.5px solid #232c3a' }}>
          <button
            className="bingo-btn-main"
            onClick={() => setMuted(!muted)}
            style={{ background: muted ? '#607d8b' : '#ff6b3d', minWidth: 80 }}
          >
            {muted ? '🔇 Unmute' : '🔊 Mute'}
          </button>
          <button
            className="bingo-btn-main"
            onClick={handleLeaveLobby}
            style={{ background: '#e53935', minWidth: 80 }}
          >
            Leave
          </button>
          <button
            className="bingo-btn-main"
            style={{ background: '#43a047', minWidth: 80 }}
            onClick={() => {
              setBingoError('');
              if (!bingoCard || !calledNumbers) return;
              const winCells = getBingoWinCells(bingoCard, calledNumbers);
              if (winCells) {
                setWinningCells(winCells);
                setGameWinner(user.telegramId);
              } else {
                setBingoError('No Bingo yet! Keep playing.');
              }
            }}
          >
            Bingo!
          </button>
        </div>
        {bingoError && (
          <div style={{ color: '#e53935', fontWeight: 700, marginTop: 8 }}>{bingoError}</div>
        )}
      </div>
    );
  }
  return null;
}
