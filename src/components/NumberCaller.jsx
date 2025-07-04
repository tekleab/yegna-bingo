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
    <div className="number-caller">
      <button onClick={onCallNext} disabled={calledNumbers.length >= allNumbers.length}>
        Call Next Number
      </button>
      <div className="called-numbers">
        <strong>Last Called:</strong> {lastNumber ? `${getBingoLetter(lastNumber)}-${lastNumber}` : '-'}
      </div>
      <div className="all-called">
        <strong>All Called:</strong> {calledNumbers.map(n => `${getBingoLetter(n)}-${n}`).join(', ')}
      </div>
    </div>
  );
}

export default NumberCaller;
