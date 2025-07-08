// Pure Bingo game logic for server or frontend use

// Generate a 5x5 Bingo card for a given cardId (1-100)
export function getCardNumbers(cardId) {
  const B_RANGE = Array.from({length:15},(_,i)=>i+1);
  const I_RANGE = Array.from({length:15},(_,i)=>i+16);
  const N_RANGE = Array.from({length:15},(_,i)=>i+31);
  const G_RANGE = Array.from({length:15},(_,i)=>i+46);
  const O_RANGE = Array.from({length:15},(_,i)=>i+61);
  const BINGO_RANGES = [B_RANGE, I_RANGE, N_RANGE, G_RANGE, O_RANGE];
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
  const card = [];
  for (let col = 0; col < 5; col++) {
    let nums = seededShuffle(BINGO_RANGES[col], (cardId+col)*31).slice(0,5);
    card.push(nums);
  }
  card[2][2] = 'FREE';
  return Array.from({length:5},(_,row)=>card.map(col=>col[row]));
}

// Assign a card (returns cardId not already taken)
export function assignCard(lockedCardIds) {
  const available = Array.from({length:100},(_,i)=>i+1).filter(id=>!lockedCardIds.includes(id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random()*available.length)];
}

// Call next number (returns a number not yet called)
export function callNextNumber(calledNumbers) {
  const ALL_NUMBERS = Array.from({length:75},(_,i)=>i+1);
  const remaining = ALL_NUMBERS.filter(n=>!calledNumbers.includes(n));
  if (remaining.length === 0) return null;
  return remaining[Math.floor(Math.random()*remaining.length)];
}

// Check for Bingo win (returns winning cells or null)
export function getBingoWinCells(card, calledNumbers) {
  const isMarked = (row, col) => {
    if (row === 2 && col === 2) return true;
    return calledNumbers.includes(card[row][col]);
  };
  for (let r = 0; r < 5; r++) {
    if ([0,1,2,3,4].every(c => isMarked(r, c))) return [0,1,2,3,4].map(c => [r, c]);
  }
  for (let c = 0; c < 5; c++) {
    if ([0,1,2,3,4].every(r => isMarked(r, c))) return [0,1,2,3,4].map(r => [r, c]);
  }
  if ([0,1,2,3,4].every(i => isMarked(i, i))) return [0,1,2,3,4].map(i => [i, i]);
  if ([0,1,2,3,4].every(i => isMarked(i, 4-i))) return [0,1,2,3,4].map(i => [i, 4-i]);
  return null;
} 