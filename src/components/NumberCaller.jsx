import React from 'react';

function getBingoLetter(num) {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return '';
}

function NumberCaller({ calledNumbers, onCallNext, allNumbers }) {
  const lastNumber = calledNumbers[calledNumbers.length - 1];
  return (
    <div style={{ 
      background: '#1a1a1a', 
      padding: '12px', 
      borderRadius: '12px', 
      margin: '12px 0',
      border: '2px solid #333',
      maxWidth: 340,
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <h3 style={{ color: '#fff', marginBottom: '10px', fontSize: 18, fontWeight: 800 }}>🎮 Game Control Panel</h3>
      <div style={{ marginBottom: '10px', fontSize: 14 }}>
        <strong style={{ color: '#7ee7e7' }}>Status:</strong> 
        <span style={{ color: gameStatus.gameStarted ? '#4caf50' : '#ff9800', marginLeft: '8px', fontWeight: 700 }}>
          {gameStatus.gameStarted ? '🟢 Game Running' : '🟡 Waiting to Start'}
        </span>
      </div>
      <div style={{ marginBottom: '10px', fontSize: 14 }}>
        <strong style={{ color: '#7ee7e7' }}>Players:</strong> 
        <span style={{ color: '#fff', marginLeft: '8px', fontWeight: 700 }}>{gameStatus.players}</span>
      </div>
      <div style={{ marginBottom: '10px', fontSize: 14 }}>
        <strong style={{ color: '#7ee7e7' }}>Called Numbers:</strong> 
        <span style={{ color: '#fff', marginLeft: '8px', fontWeight: 700 }}>{gameStatus.calledNumbers?.length || 0}/75</span>
      </div>
      {gameStatus.winner && (
        <div style={{ 
          background: '#4caf50', 
          color: '#fff', 
          padding: '8px', 
          borderRadius: '8px', 
          marginBottom: '10px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: 15
        }}>
          🎉 Winner: {gameStatus.winner} 🎉
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 6 }}>
        {!gameStatus.gameStarted && (
          <>
            <button
              onClick={startGame}
              disabled={loading || gameStatus.players < 2}
              style={{
                background: gameStatus.players >= 2 ? '#4caf50' : '#666',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                cursor: gameStatus.players >= 2 ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                fontSize: 15
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
                padding: '10px 18px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 15
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
              padding: '10px 18px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 16
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
    </div>
  );
}

export default NumberCaller;
