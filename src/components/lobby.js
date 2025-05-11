import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from './apiConfig';

const Lobby = ({ user }) => {
  const [gameCode, setGameCode] = useState('');
  const navigate = useNavigate();

  const handleHostGame = async () => {
    try {
      const response = await fetch(`${API_BASE}/create-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: user.id })
      });
  
      const data = await response.json();
      if (data.success) {
        navigate(`/${user.username}/host/${data.gameCode}`);
      } else {
        alert(data.message || 'Failed to create game.');
      }
    } catch (err) {
      console.error("Error creating game:", err);
      alert("Server error. Try again later.");
    }
  };
  
  const handleJoinGame = async () => {
    if (gameCode.trim() === '') {
        return;
    }
    console.log(`Attempting to join ${gameCode}`);
    try {
      const response = await fetch(`${API_BASE}/join-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            playerId: user.id,
            gameCode: gameCode
        })
      });
  
      const data = await response.json();
      if (data.success) {
        navigate(`/${user.username}/player/${gameCode}`);
      } else {
        alert(data.message || 'Game not found or unavailable.');
      }
    } catch (err) {
      console.error("Error joining game:", err);
      alert("Server error. Try again later.");
    }
  };  

  return (
    <div className="lobby-container">
      <h2>Draw to Impress (Provisional)</h2>

      <div className="join-section">
        <h3>Join a Game</h3>
        <input
          type="text"
          placeholder="Enter game code"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value)}
        />
        <button onClick={handleJoinGame}>Join</button>
      </div>

      <div className="host-section">
        <h3>Or</h3>
        <button onClick={handleHostGame}>Host a Game</button>
      </div>
    </div>
  );
};

export default Lobby;
