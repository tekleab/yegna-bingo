import React from 'react';
import './BingoCard.css';

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

function BingoCard({ card, marked, onMark, calledNumbers, winningCells = [] }) {
  // Convert winningCells to a Set of 'row,col' strings for fast lookup
  const winningSet = new Set(winningCells.map(([r, c]) => `${r},${c}`));
  return (
    <div className="player-card-container" style={{ boxShadow: '0 4px 24px #0003', background: '#fffbe6', border: '2.5px solid #ffe066', padding: '1.5rem 1rem', borderRadius: 20 }}>
      <div className="bingo-header" style={{ marginBottom: 10 }}>
        {BINGO_LETTERS.map((letter, idx) => (
          <div
            className={`bingo-header-circle ${letter.toLowerCase()}`}
            key={idx}
            style={{
              fontSize: 22,
              fontWeight: 900,
              width: 36,
              height: 36,
              margin: '0 4px',
              background: ['#ffe066','#7ee7e7','#fffbe6','#ff6b3d','#a66bff'][idx],
              color: ['#b07d00','#0a6b6b','#b07d00','#fff','#fff'][idx],
              boxShadow: '0 2px 8px #0001',
              border: '2px solid #fff',
            }}
          >
            {letter}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {card.map((row, rowIndex) => (
          <div className="bingo-row" key={rowIndex} style={{ gap: 2 }}>
            {row.map((num, colIndex) => {
              const isMarked = marked[rowIndex][colIndex];
              const isFree = rowIndex === 2 && colIndex === 2;
              const isWinning = winningSet.has(`${rowIndex},${colIndex}`);
              let cellClass = 'bingo-cell';
              if (isFree) cellClass += ' free';
              else if (isMarked) cellClass += ' marked';
              if (isWinning) cellClass += ' winning';
              return (
                <button
                  key={colIndex}
                  className={cellClass}
                  style={{
                    width: 38,
                    height: 38,
                    margin: 1,
                    fontSize: 16,
                    fontWeight: isFree ? 900 : 700,
                    background: isFree
                      ? 'linear-gradient(135deg, #ffe066 60%, #fffbe6 100%)'
                      : isWinning
                      ? 'linear-gradient(135deg, #7ee7e7 60%, #fffbe6 100%)'
                      : isMarked
                      ? '#ff6b3d'
                      : '#232c3a',
                    color: isFree
                      ? '#b07d00'
                      : isWinning
                      ? '#0a6b6b'
                      : isMarked
                      ? '#fff'
                      : '#fff',
                    border: isFree
                      ? '2px solid #ffe066'
                      : isWinning
                      ? '2px solid #7ee7e7'
                      : isMarked
                      ? '2px solid #ff6b3d'
                      : '1.5px solid #222',
                    boxShadow: isWinning
                      ? '0 0 12px 2px #7ee7e7, 0 0 0 2px #0a6b6b'
                      : isMarked
                      ? '0 0 0 2px #fff, 0 0 8px #ff6b3d'
                      : '0 1px 4px #0002',
                    cursor: isFree ? 'default' : isMarked ? 'pointer' : 'pointer',
                    transition: 'all 0.18s',
                  }}
                  onClick={() => !isFree && calledNumbers.includes(num) && onMark(rowIndex, colIndex)}
                  disabled={isFree || !calledNumbers.includes(num)}
                >
                  {isFree ? 'FREE' : num}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BingoCard;
