import React, { useState } from "react";

export default function CardSelection({ takenCards, onPlay }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="card-selection-mobile" style={{ width: '100%', maxWidth: 340, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Pick a Card</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' }}>
        {Array.from({ length: 100 }, (_, i) => i + 1).map(num => (
          <button
            key={num}
            className="card-select-btn"
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: takenCards.includes(num) ? '#eee' : '#43a047',
              color: takenCards.includes(num) ? '#aaa' : '#fff',
              fontWeight: 800,
              fontSize: 15,
              border: takenCards.includes(num) ? '2px solid #ccc' : '2px solid #43a047',
              margin: 2,
              cursor: takenCards.includes(num) ? 'not-allowed' : 'pointer',
              boxShadow: takenCards.includes(num) ? 'none' : '0 1px 4px #0002',
              transition: 'background 0.18s, color 0.18s',
            }}
            disabled={takenCards.includes(num)}
            onClick={() => onPlay(num)}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
} 