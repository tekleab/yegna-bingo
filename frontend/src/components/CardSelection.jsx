import React, { useState } from "react";

export default function CardSelection({ takenCards, onPlay }) {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2 style={{ marginBottom: 20, fontSize: 24, fontWeight: 700 }}>Select Your Card</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, 1fr)',
        gap: 10,
        justifyContent: 'center',
        margin: '0 auto',
        maxWidth: 600
      }}>
        {Array.from({ length: 100 }, (_, i) => i + 1).map(num => (
          <button
            key={num}
            disabled={takenCards.includes(num)}
            style={{
              padding: '14px 0',
              borderRadius: 8,
              border: selected === num ? '3px solid #ff9800' : '2px solid #2196f3',
              background: takenCards.includes(num)
                ? '#bdbdbd'
                : selected === num
                ? '#ffe082'
                : '#2196f3',
              color: takenCards.includes(num) ? '#fff' : selected === num ? '#e65100' : '#fff',
              fontWeight: 700,
              fontSize: 18,
              cursor: takenCards.includes(num) ? 'not-allowed' : 'pointer',
              minWidth: 44,
              boxShadow: selected === num ? '0 0 10px #ff9800' : '0 1px 4px rgba(0,0,0,0.08)',
              transition: 'all 0.15s',
            }}
            onClick={() => setSelected(num)}
          >
            {num}
          </button>
        ))}
      </div>
      <button
        style={{
          marginTop: 28,
          padding: '14px 40px',
          borderRadius: 10,
          border: 'none',
          background: selected ? '#43a047' : '#bdbdbd',
          color: '#fff',
          fontWeight: 700,
          fontSize: 20,
          cursor: selected ? 'pointer' : 'not-allowed',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          transition: 'background 0.15s',
        }}
        disabled={!selected}
        onClick={() => selected && onPlay(selected)}
      >
        Play
      </button>
    </div>
  );
} 