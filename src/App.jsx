import React from "react";
import { useState, useEffect, useRef } from 'react'
import BingoCard from './components/BingoCard'
import NumberCaller from './components/NumberCaller'
import './App.css'
import { getCardNumbers, assignCard, callNextNumber, getBingoWinCells } from './bingoGameLogic';
import YegnaBingoLogo from './assets/YegnaBingoLogo.svg';
import Lobby from './components/Lobby';
import CardSelection from './components/CardSelection';

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
  const [card, setCard] = useState(generateBingoCard())
  const [marked, setMarked] = useState(getInitialMarked())
  const [calledNumbers, setCalledNumbers] = useState([])
  const [win, setWin] = useState(false)
  const [winningCells, setWinningCells] = useState([])
  const [muted, setMuted] = useState(false)
  const [countdown, setCountdown] = useState(30);
  const [cartelaNumber, setCartelaNumber] = useState(null);
  const [showCartelaWarning, setShowCartelaWarning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [cardSelectionPhase, setCardSelectionPhase] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [drawCountdown, setDrawCountdown] = useState(3);
  const [drawInterval, setDrawInterval] = useState(null);
  const [wallet, setWallet] = useState(500); // ETB
  const [stake, setStake] = useState(10);
  const [stakeError, setStakeError] = useState('');
  const stakeOptions = [10, 20, 50, 100];
  const [activeGames, setActiveGames] = useState(3);
  const [playerCount, setPlayerCount] = useState(27);
  const [botMessage, setBotMessage] = useState('');
  const [lockedCards, setLockedCards] = useState([2, 7, 13, 21, 33]);
  const [bingoStatus, setBingoStatus] = useState(''); // '', 'win', 'notyet'
  const confettiRef = useRef();
  const [stage, setStage] = useState('lobby'); // 'lobby', 'card', 'game'
  const [selectedBet, setSelectedBet] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [gameKey, setGameKey] = useState(0); // for resetting game
  const playerCounts = { 10: 2, 20: 2, 25: 1, 50: 1, 100: 0 };
  const takenCards = [5, 12, 23, 59, 77];

  // Mock locked card IDs (simulate other users)
  const lockedCardIds = [7, 13, 22, 45, 67, 88];

  // Countdown timer effect (only after game started)
  useEffect(() => {
    if (gameStarted && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [gameStarted, countdown]);

  // Start number calling after Play
  useEffect(() => {
    if (gameStarted && !drawInterval) {
      setDrawCountdown(3);
      const interval = setInterval(() => {
        setDrawCountdown(prev => {
          if (prev > 1) return prev - 1;
          // Draw a new number atomically
          setDrawCountdown(3);
          setCalledNumbers(prevCalled => {
            const remaining = ALL_NUMBERS.filter(n => !prevCalled.includes(n));
            if (remaining.length === 0) return prevCalled;
            const next = remaining[Math.floor(Math.random() * remaining.length)];
            // Update both currentCall and calledNumbers together
            setCurrentCall(next);
            speakAmharicNumber(next);
            return [...prevCalled, next];
          });
          return 3;
        });
      }, 1000);
      setDrawInterval(interval);
      return () => clearInterval(interval);
    }
    return () => {};
  }, [gameStarted]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (drawInterval) clearInterval(drawInterval);
    };
  }, [drawInterval]);

  const handleMark = (row, col) => {
    if (!calledNumbers.includes(card[row][col])) return
    const newMarked = marked.map(arr => arr.slice())
    newMarked[row][col] = true
    setMarked(newMarked)
    const bingoResult = checkBingo(newMarked)
    if (bingoResult) {
      setWin(true)
      // Calculate winning cells
      let cells = [];
      if (bingoResult.type === 'row') {
        cells = Array(5).fill(0).map((_, c) => [bingoResult.index, c]);
      } else if (bingoResult.type === 'col') {
        cells = Array(5).fill(0).map((_, r) => [r, bingoResult.index]);
      } else if (bingoResult.type === 'diag' && bingoResult.dir === 'main') {
        cells = Array(5).fill(0).map((_, i) => [i, i]);
      } else if (bingoResult.type === 'diag' && bingoResult.dir === 'anti') {
        cells = Array(5).fill(0).map((_, i) => [i, 4-i]);
      }
      setWinningCells(cells);
    }
  }

  const handleCallNext = () => {
    const remaining = ALL_NUMBERS.filter(n => !calledNumbers.includes(n))
    if (remaining.length === 0) return
    const next = remaining[Math.floor(Math.random() * remaining.length)]
    setCalledNumbers([...calledNumbers, next])
    speakAmharicNumber(next, muted)
  }

  const handleReset = () => {
    setCard(generateBingoCard())
    setMarked(getInitialMarked())
    setCalledNumbers([])
    setWin(false)
    setWinningCells([])
  }

  // Generate main number grid (1-100)
  const mainNumbers = Array.from({ length: 100 }, (_, i) => i + 1);

  // Handler for Start Game
  function handleStartGame() {
    setCardSelectionPhase(true);
  }

  // Handler for Play (after card selection)
  function handlePlay() {
    if (wallet < stake) {
      setStakeError('Insufficient balance!');
      return;
    }
    setWallet(w => w - stake);
    setStakeError('');
    setGameStarted(true);
  }

  // Dynamic active games/player count
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGames(g => g + (Math.random() > 0.5 ? 1 : -1));
      setPlayerCount(p => p + Math.floor(Math.random() * 3 - 1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic card locking during selection phase
  useEffect(() => {
    if (!cardSelectionPhase || gameStarted) return;
    const interval = setInterval(() => {
      setLockedCards(prev => {
        if (prev.length >= 30) return prev;
        let newCard;
        do {
          newCard = Math.floor(Math.random() * 100) + 1;
        } while (prev.includes(newCard));
        setBotMessage(`Card ${newCard} locked by another player!`);
        return [...prev, newCard];
      });
      setPlayerCount(p => p + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, [cardSelectionPhase, gameStarted]);

  // Clear bot message after a few seconds
  useEffect(() => {
    if (!botMessage) return;
    const t = setTimeout(() => setBotMessage(''), 2200);
    return () => clearTimeout(t);
  }, [botMessage]);

  // Check for Bingo win and return winning cells
  function getBingoWinCells() {
    if (!cartelaNumber) return null;
    const card = getCartelaCard(cartelaNumber);
    const isMarked = (row, col) => {
      if (row === 2 && col === 2) return true; // Free
      return calledNumbers.includes(card[row][col]);
    };
    // Rows
    for (let r = 0; r < 5; r++) {
      if ([0,1,2,3,4].every(c => isMarked(r, c))) return [0,1,2,3,4].map(c => [r, c]);
    }
    // Columns
    for (let c = 0; c < 5; c++) {
      if ([0,1,2,3,4].every(r => isMarked(r, c))) return [0,1,2,3,4].map(r => [r, c]);
    }
    // Diagonals
    if ([0,1,2,3,4].every(i => isMarked(i, i))) return [0,1,2,3,4].map(i => [i, i]);
    if ([0,1,2,3,4].every(i => isMarked(i, 4-i))) return [0,1,2,3,4].map(i => [i, 4-i]);
    return null;
  }

  // Bingo button handler
  function handleBingo() {
    const winCells = getBingoWinCells();
    if (winCells) {
      setBingoStatus('win');
      setWinningCells(winCells);
    } else {
      setBingoStatus('notyet');
      setWinningCells([]);
    }
  }

  // Play confetti and sound on win
  useEffect(() => {
    if (bingoStatus === 'win') {
      // Confetti burst
      if (confettiRef.current) {
        const canvas = confettiRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const colors = ['#ffe066','#ff6b3d','#7ee7e7','#fffbe6','#b07d00'];
        let particles = Array.from({length:80},()=>({
          x: Math.random()*canvas.width,
          y: -20,
          r: 6+Math.random()*6,
          c: colors[Math.floor(Math.random()*colors.length)],
          vx: (Math.random()-0.5)*6,
          vy: 4+Math.random()*6,
          g: 0.25+Math.random()*0.15
        }));
        let frame = 0;
        function draw() {
          ctx.clearRect(0,0,canvas.width,canvas.height);
          particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x,p.y,p.r,0,2*Math.PI);
            ctx.fillStyle = p.c;
            ctx.fill();
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.g;
          });
          frame++;
          if (frame < 60) requestAnimationFrame(draw);
        }
        draw();
        setTimeout(()=>ctx.clearRect(0,0,canvas.width,canvas.height), 2500);
      }
      // Play win sound
      const audio = new window.Audio('/win.mp3');
      audio.play();
    }
  }, [bingoStatus]);

  // SVG icons
  const WalletIcon = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="3" fill="#ffe066" stroke="#b07d00" strokeWidth="2"/><rect x="15" y="11" width="3" height="2" rx="1" fill="#ff6b3d"/></svg>
  );
  const GamesIcon = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#7ee7e7" stroke="#0a6b6b" strokeWidth="2"/><circle cx="12" cy="12" r="3" fill="#fff"/></svg>
  );
  const StakeIcon = () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="6" fill="#ff6b3d" stroke="#fff" strokeWidth="2"/><text x="12" y="16" textAnchor="middle" fontSize="1.1em" fill="#fff" fontWeight="bold">ETB</text></svg>
  );

  // Play Again handler
  const handlePlayAgain = () => {
    setStage('card');
    setSelectedCard(null);
    setGameKey(k => k + 1);
  };

  // Render lobby, card selection, or game
  if (stage === 'lobby') {
    return <Lobby playerCounts={playerCounts} onJoin={(bet) => { setSelectedBet(bet); setStage('card'); }} />;
  }
  if (stage === 'card') {
    return <CardSelection takenCards={takenCards} onPlay={(num) => { setSelectedCard(num); setStage('game'); }} />;
  }
  // Side-by-side game layout with visible header bar
  return (
    <div>
      <h1 style={{color: 'red'}}>THIS IS VERSION 2</h1>
      <div className="bingo-app-container">
        <header className="bingo-header-bar">
          <img src={YegnaBingoLogo} alt="Yegna Bingo Logo" className="bingo-logo" />
          <span className="bingo-title">Yegna Bingo</span>
        </header>
        <main className="bingo-main-card">
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 32,
            background: '#23272f',
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
            padding: '16px 0',
            borderBottom: '4px solid #1976d2',
            boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
            position: 'relative',
            zIndex: 2,
            letterSpacing: 0.5,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#43a047', borderRadius: 6, padding: '2px 10px', color: '#fff', display: 'flex', alignItems: 'center', fontWeight: 900 }}>🟩 Bet:</span>
              <span style={{ color: '#ffd600', fontWeight: 900 }}>{selectedBet}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#ff9800', borderRadius: 6, padding: '2px 10px', color: '#fff', display: 'flex', alignItems: 'center', fontWeight: 900 }}>🏆 Win:</span>
              <span style={{ color: '#ffd600', fontWeight: 900 }}>{(selectedBet * (playerCounts[selectedBet] || 1) * 0.8).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#1976d2', borderRadius: 6, padding: '2px 10px', color: '#fff', display: 'flex', alignItems: 'center', fontWeight: 900 }}>👥 Players:</span>
              <span style={{ color: '#7ee7e7', fontWeight: 900 }}>{playerCounts[selectedBet] || 1}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#b07d00', borderRadius: 6, padding: '2px 10px', color: '#fff', display: 'flex', alignItems: 'center', fontWeight: 900 }}>💰 Balance:</span>
              <span style={{ color: '#ffe066', fontWeight: 900 }}>{wallet}</span>
            </div>
          </div>
          <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', maxWidth: 700, margin: '0 auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px #0002', overflow: 'hidden', marginTop: 32 }}>
            <div style={{ flex: 1.2, background: '#e3f2fd', borderRight: '3px solid #ff9800', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', minWidth: 220 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 32px)', gap: 2, marginBottom: 2 }}>
                {BINGO_LETTERS.map((letter, col) => (
                  <div key={letter} style={{
                    fontWeight: 900,
                    fontSize: 18,
                    color: '#fff',
                    background: '#1976d2',
                    borderRadius: 4,
                    textAlign: 'center',
                    padding: '2px 0',
                    letterSpacing: 2,
                    boxShadow: '0 1px 2px #1976d222',
                  }}>{letter}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 32px)', gap: 2, marginBottom: 0 }}>
                {BINGO_LETTERS.map((letter, col) => (
                  <React.Fragment key={letter}>
                    {BINGO_RANGES[col].map(num => {
                      const isCalled = calledNumbers.includes(num);
                      const isCurrent = currentCall === num;
                      return (
                        <div
                          key={num}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 4,
                            background: isCurrent ? '#ff9800' : isCalled ? '#e74c3c' : '#fff',
                            color: isCurrent || isCalled ? '#fff' : '#23272f',
                            fontWeight: isCurrent ? 900 : 700,
                            fontSize: 15,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: 0,
                            boxShadow: isCurrent ? '0 0 8px 2px #ff9800' : isCalled ? '0 0 4px #e74c3c' : '0 1px 2px #0001',
                            border: isCurrent ? '2.5px solid #fff' : isCalled ? '2px solid #e74c3c' : '1.5px solid #bbb',
                            transition: 'all 0.18s',
                          }}
                        >
                          {num}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, background: '#fffde7', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', minWidth: 220, position: 'relative' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ff9800', marginBottom: 6, letterSpacing: 1, textAlign: 'center' }}>
                Next draw in: 0:{drawCountdown < 10 ? `0${drawCountdown}` : drawCountdown}
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', background: '#1976d2', borderRadius: 8, padding: '8px 32px', marginBottom: 12, boxShadow: '0 2px 8px #1976d222', letterSpacing: 2, textAlign: 'center' }}>
                Drawn: {currentCall ? `${getBingoLetter(currentCall)}-${currentCall}` : '-'}
              </div>
              {win && (
                <div style={{ fontSize: 18, fontWeight: 700, color: '#43a047', marginBottom: 10, background: '#e6fff2', borderRadius: 6, padding: '6px 14px', boxShadow: '0 2px 8px #43a04722', textAlign: 'center' }}>
                  🎉 Card #{selectedCard} wins by col!
                </div>
              )}
              <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 10, color: '#888', letterSpacing: 1 }}>Your Card</h2>
              <div style={{ background: '#23272f', borderRadius: 16, padding: 18, marginBottom: 10, boxShadow: '0 2px 8px #23272f22' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 28px)', gap: 2, marginBottom: 2 }}>
                  {BINGO_LETTERS.map((letter, col) => (
                    <div key={letter} style={{
                      fontWeight: 900,
                      fontSize: 15,
                      color: '#fff',
                      background: ['#1976d2','#43a047','#ffd600','#ff9800','#ab47bc'][col],
                      borderRadius: 4,
                      textAlign: 'center',
                      padding: '2px 0',
                      letterSpacing: 1,
                      boxShadow: '0 1px 2px #0002',
                    }}>{letter}</div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 28px)', gap: 2 }}>
                  {card.map((row, rowIndex) => (
                    row.map((num, colIndex) => {
                      const isMarked = marked[rowIndex][colIndex];
                      const isWinning = winningCells.some(([r, c]) => r === rowIndex && c === colIndex);
                      const isFree = rowIndex === 2 && colIndex === 2;
                      return (
                        <div
                          key={colIndex}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 4,
                            background: isFree ? '#ffd600' : isWinning ? '#43a047' : isMarked ? '#ffe066' : '#333',
                            color: isFree ? '#fff' : isWinning ? '#fff' : isMarked ? '#23272f' : '#fff',
                            fontWeight: isFree || isWinning ? 900 : 700,
                            fontSize: 14,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: 0,
                            border: isWinning ? '2px solid #43a047' : isMarked ? '2px solid #ffd600' : '1.5px solid #222',
                            boxShadow: isWinning ? '0 0 8px 2px #43a047' : isMarked ? '0 0 4px #ffd600' : '0 1px 2px #0001',
                            transition: 'all 0.18s',
                          }}
                        >
                          {isFree ? 'FREE' : num}
                        </div>
                      );
                    })
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600, color: '#2196f3', letterSpacing: 1 }}>Card #{selectedCard}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  style={{
                    padding: '10px 24px',
                    borderRadius: 6,
                    background: '#eee',
                    color: '#e91e63',
                    fontWeight: 700,
                    fontSize: 16,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px #0001',
                    transition: 'background 0.18s',
                  }}
                  onClick={() => window.location.reload()}
                >
                  Leave
                </button>
                <button
                  style={{
                    padding: '10px 24px',
                    borderRadius: 6,
                    background: '#eee',
                    color: '#1976d2',
                    fontWeight: 700,
                    fontSize: 16,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px #0001',
                    transition: 'background 0.18s',
                  }}
                  onClick={handleBingo}
                >
                  Bingo
                </button>
              </div>
              {win && (
                <button
                  style={{
                    marginTop: 18,
                    padding: '10px 32px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#43a047',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 18,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                    transition: 'background 0.15s',
                  }}
                  onClick={handlePlayAgain}
                >
                  Play Again
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
