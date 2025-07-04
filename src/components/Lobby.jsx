import React from "react";

const BET_OPTIONS = [10, 20, 25, 50, 100];

export default function Lobby({ playerCounts, onJoin }) {
  return (
    <div className="lobby-mobile-container">
      <h2>Choose a Game Type</h2>
      <table className="lobby-mobile-table">
        <thead>
          <tr>
            <th>🟩 Bet</th>
            <th>👥</th>
            <th>🏆</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {BET_OPTIONS.map(bet => (
            <tr key={bet}>
              <td>{bet}</td>
              <td>{playerCounts[bet] || 0}</td>
              <td>
                {(bet * (playerCounts[bet] || 1) * 0.8).toFixed(2)}
              </td>
              <td>
                <button
                  onClick={() => onJoin(bet)}
                >
                  Join
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 