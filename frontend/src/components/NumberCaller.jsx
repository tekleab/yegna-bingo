import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = 'https://yegna-bingo.onrender.com';

export default function NumberCaller({ bet, onGameUpdate }) {
  const [gameStatus, setGameStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bet) return;
    fetchGameStatus();
    const interval = setInterval(fetchGameStatus, 3000);
    return () => clearInterval(interval);
  }, [bet]);

  const fetchGameStatus = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/game/status/${bet}`);
      setGameStatus(res.data);
      if (onGameUpdate) onGameUpdate(res.data);
    } catch (err) {
      console.error('Failed to fetch game status:', err);
    }
  };

  const startGame = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/game/start/${bet}`);
      await fetchGameStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start game');
    }
    setLoading(false);
  };

  const callNumber = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${BACKEND_URL}/game/call/${bet}`);
      await fetchGameStatus();
      return res.data.calledNumber;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to call number');
    }
    setLoading(false);
  };

  const autoStart = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/lobby/auto-start/${bet}`);
      await fetchGameStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to auto-start');
    }
    setLoading(false);
  };

  if (!gameStatus) {
    return <div>Loading game status...</div>;
  }

  return (
    <div style={{ 
      background: '#1a1a1a', 
      padding: '20px', 
      borderRadius: '12px', 
      margin: '20px 0',
      border: '2px solid #333'
    }}>
      <h3 style={{ color: '#fff', marginBottom: '15px' }}>🎮 Game Control Panel</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong style={{ color: '#7ee7e7' }}>Status:</strong> 
        <span style={{ color: gameStatus.gameStarted ? '#4caf50' : '#ff9800', marginLeft: '8px' }}>
          {gameStatus.gameStarted ? '🟢 Game Running' : '🟡 Waiting to Start'}
        </span>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong style={{ color: '#7ee7e7' }}>Players:</strong> 
        <span style={{ color: '#fff', marginLeft: '8px' }}>{gameStatus.players}</span>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong style={{ color: '#7ee7e7' }}>Called Numbers:</strong> 
        <span style={{ color: '#fff', marginLeft: '8px' }}>{gameStatus.calledNumbers?.length || 0}/75</span>
      </div>

      {gameStatus.winner && (
        <div style={{ 
          background: '#4caf50', 
          color: '#fff', 
          padding: '10px', 
          borderRadius: '8px', 
          marginBottom: '15px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          🎉 Winner: {gameStatus.winner} 🎉
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {!gameStatus.gameStarted && (
          <>
            <button
              onClick={startGame}
              disabled={loading || gameStatus.players < 2}
              style={{
                background: gameStatus.players >= 2 ? '#4caf50' : '#666',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: gameStatus.players >= 2 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Starting...' : 'Start Game'}
            </button>
            
            <button
              onClick={autoStart}
              disabled={loading}
              style={{
                background: '#2196f3',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Processing...' : 'Auto-Start (2+ players)'}
            </button>
          </>
        )}

        {gameStatus.gameStarted && !gameStatus.winner && (
          <button
            onClick={callNumber}
            disabled={loading}
            style={{
              background: '#ff6b3d',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            {loading ? 'Calling...' : '🎲 Call Next Number'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: '#f44336', marginTop: '10px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {gameStatus.calledNumbers && gameStatus.calledNumbers.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <strong style={{ color: '#7ee7e7' }}>Recent Numbers:</strong>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '5px', 
            marginTop: '5px' 
          }}>
            {gameStatus.calledNumbers.slice(-10).reverse().map(num => (
              <div key={num} style={{
                background: '#ffe066',
                color: '#333',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '12px'
              }}>
                {num}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
