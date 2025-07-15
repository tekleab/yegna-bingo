import React from 'react';
import './BingoCard.css';

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

function BingoCard({ card, marked, onMark, calledNumbers, winningCells = [] }) {
  // Convert winningCells to a Set of 'row,col' strings for fast lookup
  const winningSet = new Set(winningCells.map(([r, c]) => `${r},${c}`));
  return (
    <div className="player-card-container bingo-mobile-card">
      <div className="bingo-header" style={{ marginBottom: 10 }}>
        {BINGO_LETTERS.map((letter, idx) => (
          <div
            className={`bingo-header-circle ${letter.toLowerCase()}`}
            key={idx}
          >
            {letter}
          </div>
        ))}
      </div>
      <div className="bingo-card-grid">
        {card.map((row, rowIndex) => (
          <div className="bingo-row" key={rowIndex}>
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
                  className={cellClass + ' bingo-mobile-cell'}
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
