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
        <div className="vertical">
        <img src="/Images/Title.png" width="1024px" height="196px"/>
      
      <div className="join-section">
        <h3>Join a Game</h3>
        <input
          className='input_code'
          type="text"
          placeholder="Enter game code"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value)}
        />
        <button className='regular' onClick={handleJoinGame}>Join</button>

        <h3>Or</h3>
        <button className='regular' onClick={handleHostGame}>Host a Game</button>
      </div>
      </div>
    </div>
  );
};

export default Lobby;
