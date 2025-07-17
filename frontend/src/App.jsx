import React, { useState, useEffect } from 'react';
import BingoCard from './components/BingoCard'
import NumberCaller from './components/NumberCaller'
import './App.css'
import { getCardNumbers, getBingoWinCells } from './bingoGameLogic';
import YegnaBingoLogo from './assets/YegnaBingoLogo.svg';
import Lobby from './components/Lobby';
import CardSelection from './components/CardSelection';
import axios from 'axios';

const BACKEND_URL = 'https://yegna-bingo.onrender.com';

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

// REMOVE all registration and login logic
// Always use a default test user
export default function App() {
  const [user] = useState({ name: 'Test User', phone: '0000000000', telegramId: 'testuser' });
  const [wallet, setWallet] = useState(null);
  const [playerCounts, setPlayerCounts] = useState({});
  const [stage, setStage] = useState('lobby'); // 'lobby', 'card', 'game'
  const [selectedBet, setSelectedBet] = useState(null);
  const [takenCards, setTakenCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Game state
  const [bingoCard, setBingoCard] = useState(null);
  const [marked, setMarked] = useState(null);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [winningCells, setWinningCells] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWinner, setGameWinner] = useState(null);
  const [muted, setMuted] = useState(false);
  // Add state for bingo claim error
  const [bingoError, setBingoError] = useState('');

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
    axios.get(`${BACKEND_URL}/wallet/${user?.phone}`)
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
      await axios.post(`${BACKEND_URL}/lobby/join`, { name: user?.name, phone: user?.phone, bet });
      // Fetch taken cards
      const res = await axios.get(`${BACKEND_URL}/lobby/cards/${bet}`);
      setTakenCards(Array.from({ length: 100 }, (_, i) => i + 1).filter(num => !res.data.available.includes(num)));
      setSelectedBet(bet);
      setStage('card');
    } catch (err) {
      if (err.response?.data?.error === 'Already in lobby') {
        // Fetch lobby status to determine if user has a card
        try {
          const lobbyRes = await axios.get(`${BACKEND_URL}/lobby/status/${bet}`);
          setSelectedBet(bet);
          // Check if user has an assigned card
          const assignedCard = lobbyRes.data.lobby?.assignedCards?.[user?.phone];
          if (assignedCard) {
            setSelectedCard(assignedCard);
            // Generate the actual Bingo card
            const card = getCardNumbers(assignedCard);
            setBingoCard(card);
            setMarked(Array.from({ length: 5 }, (_, r) =>
              Array.from({ length: 5 }, (_, c) => r === 2 && c === 2)
            ));
            setStage('game');
          } else {
            // Fetch taken cards for card selection
            const res = await axios.get(`${BACKEND_URL}/lobby/cards/${bet}`);
            setTakenCards(Array.from({ length: 100 }, (_, i) => i + 1).filter(num => !res.data.available.includes(num)));
            setStage('card');
          }
        } catch (fetchErr) {
          setError('Failed to fetch lobby status.');
        }
      } else {
        setError(err.response?.data?.error || 'Failed to join lobby.');
      }
    }
    setLoading(false);
  };

  // Assign card
  const handleAssignCard = async (cardNum) => {
    if (!user || !selectedBet) return;
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/lobby/assign_card`, { name: user?.name, phone: user?.phone, bet: selectedBet, card: cardNum });
      setSelectedCard(cardNum);
      
      // Generate the actual Bingo card
      const card = getCardNumbers(cardNum);
      setBingoCard(card);
      setMarked(Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 5 }, (_, c) => r === 2 && c === 2)
      ));
      setCalledNumbers([]);
      setWinningCells([]);
      setGameStarted(false);
      setGameWinner(null);
      
      setStage('game');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign card.');
    }
    setLoading(false);
  };

  // Leave lobby logic
  const handleLeaveLobby = async () => {
    if (!user || !selectedBet) return;
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/lobby/leave`, { name: user?.name, phone: user?.phone, bet: selectedBet });
      setSelectedBet(null);
      setTakenCards([]);
      setSelectedCard(null);
      setStage('lobby');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to leave lobby.');
    }
    setLoading(false);
  };

  // Game logic
  const handleMarkCell = (row, col) => {
    if (!marked || gameWinner) return;
    const newMarked = marked.map(row => [...row]);
    newMarked[row][col] = !newMarked[row][col];
    setMarked(newMarked);
    
    // Check for win
    const winCells = getBingoWinCells(bingoCard, calledNumbers);
    if (winCells) {
      setWinningCells(winCells);
      if (user) setGameWinner(user.phone);
      // Play win sound
      const audio = new Audio('/win.mp3');
      audio.play().catch(() => {});
    }
  };

  // Poll for game updates
  useEffect(() => {
    if (stage !== 'game' || !selectedBet || !user) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/game/status/${selectedBet}`);
        const { calledNumbers: newCalledNumbers, gameStarted: newGameStarted, winner } = res.data;
        
        setCalledNumbers(newCalledNumbers || []);
        setGameStarted(newGameStarted || false);
        
        if (winner && !gameWinner) {
          setGameWinner(winner);
          if (user && winner === user.phone) {
            setWinningCells(getBingoWinCells(bingoCard, newCalledNumbers || []));
            const audio = new Audio('/win.mp3');
            audio.play().catch(() => {});
          }
        }
        
        // Update marked cells based on called numbers
        if (bingoCard && newCalledNumbers) {
          const newMarked = marked.map(row => [...row]);
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
              if (r === 2 && c === 2) continue; // FREE space
              if (newCalledNumbers.includes(bingoCard[r][c])) {
                newMarked[r][c] = true;
              }
            }
          }
          setMarked(newMarked);
        }
      } catch (err) {
        console.error('Failed to poll game status:', err);
      }
    }, 2000);
    
    return () => clearInterval(pollInterval);
  }, [stage, selectedBet, bingoCard, marked, gameWinner, user]);

  // UI rendering
  if (loading) {
    return <div style={{ color: '#1976d2', fontWeight: 700, fontSize: 22, marginTop: 80 }}>Loading...</div>;
  }
  // REMOVE any modal or auth checks
  // Show the game UI immediately
  if (stage === 'lobby') {
    return (
      <div>
        <h1>Yegna Bingo</h1>
        {/* Hide wallet and error for test user */}
        {user.phone !== 'testuser' && (
          <div style={{ marginBottom: 16 }}>Wallet: <b>{wallet !== null ? `${wallet} Birr` : '...'}</b></div>
        )}
        {user.phone !== 'testuser' && error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}
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
        <button onClick={handleLeaveLobby} style={{ marginTop: 16, background: '#e53935', color: '#fff', padding: '10px 24px', borderRadius: 6, border: 'none', fontWeight: 700, cursor: 'pointer' }}>Leave Lobby</button>
      </div>
    );
  }
  if (stage === 'game') {
    return (
      <div className="bingo-app-container">
        <div className="bingo-status-bar">
          {gameWinner ? 
            (gameWinner === user.phone ? '🎉 YOU WON! 🎉' : 'Game Over - Someone Won!') :
            gameStarted ? '🎮 Game in Progress' : '⏳ Waiting for players...'
          }
        </div>
        
        <div className="bingo-info-bar">
          <div className="bingo-info-box">
            <div className="bingo-info-label">Card</div>
            <div className="bingo-info-value">#{selectedCard}</div>
          </div>
          <div className="bingo-info-box">
            <div className="bingo-info-label">Bet</div>
            <div className="bingo-info-value">{selectedBet} Birr</div>
          </div>
          <div className="bingo-info-box">
            <div className="bingo-info-label">Called</div>
            <div className="bingo-info-value">{calledNumbers.length}/75</div>
          </div>
        </div>

        {/* Admin Control Panel - only show for first player or if user is admin */}
        {(user && (user.phone === 'admin' || user.phone === '123456789')) && (
          <NumberCaller 
            bet={selectedBet} 
            onGameUpdate={(status) => {
              setCalledNumbers(status.calledNumbers || []);
              setGameStarted(status.gameStarted || false);
              setGameWinner(status.winner);
            }}
          />
        )}

        {bingoCard && marked && (
          <BingoCard
            card={bingoCard}
            marked={marked}
            onMark={handleMarkCell}
            calledNumbers={calledNumbers}
            winningCells={winningCells}
          />
        )}

        <div className="called-balls-container">
          <h3>Called Numbers</h3>
          <div className="called-balls">
            {calledNumbers.map(num => (
              <div key={num} className="called-ball">
                {num}
              </div>
            ))}
          </div>
        </div>

        <div className="bingo-btn-row">
          <button 
            className="bingo-btn-main"
            onClick={() => setMuted(!muted)}
            style={{ background: muted ? '#607d8b' : '#ff6b3d' }}
          >
            {muted ? '🔇 Unmute' : '🔊 Mute'}
          </button>
          <button 
            className="bingo-btn-main"
            onClick={handleLeaveLobby}
            style={{ background: '#e53935' }}
          >
            Leave Game
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
                setGameWinner(user.phone);
              } else {
                setBingoError('No Bingo yet! Keep playing.');
              }
            }}
          >
            Test Bingo!
          </button>
        </div>
        {bingoError && (
          <div style={{ color: '#e53935', fontWeight: 700, marginTop: 8 }}>{bingoError}</div>
        )}
        {/* Confetti animation for winner */}
        {user && gameWinner === user.phone && (
          <div className="confetti">
            {Array.from({ length: 50 }, (_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%',
                  width: '10px',
                  height: '10px',
                  background: ['#ff6b3d', '#7ee7e7', '#ffe066', '#a66bff', '#4caf50'][Math.floor(Math.random() * 5)],
                  borderRadius: '50%',
                  animation: `fall ${Math.random() * 3 + 2}s linear infinite`,
                  zIndex: 10000
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
}
