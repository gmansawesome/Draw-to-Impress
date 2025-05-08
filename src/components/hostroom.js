import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const HostRoom = ({ user }) => {
  const { username, gameCode } = useParams();
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();


  const fetchPlayers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/game/${gameCode}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        setPlayers(data.players);
      } else {
        navigate(`/lobby`);
        console.error(data.message || "Failed to fetch players: Assume Game Closed");
      }
    } catch (err) {
      console.error("Error fetching players:", err);
    }
  };

  // Checking every 5 seconds
  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLeaveGame = async () => {
    try {
      const response = await fetch(`http://localhost:5000/game/${username}/${gameCode}`, {
        method: 'DELETE',
        credentials: 'include',
      });
  
      const data = await response.json();
      if (data.success) {
        navigate(`/lobby`);
      } else {
        alert(data.message || 'Failed to leave game.');
      }
    } catch (err) {
      console.error("Error leaving game:", err);
      alert("Server error. Try again later.");
    }
  };

  const handleStartGame = async () => {
    try {
      const response = await fetch(`http://localhost:5000/game/${username}/${gameCode}`, {
        method: 'POST',
        credentials: 'include',
      });
  
      const data = await response.json();
      if (data.success) {
        // navigate(`/lobby`); whiteboard
      } else {
        alert(data.message || 'Failed to start game.');
      }
    } catch (err) {
      console.error("Error starting game:", err);
      alert("Server error. Try again later.");
    }
  };

  return (
    <div className="host-room">
      <h2>Game Lobby</h2>
      <p>Game Code: {gameCode}</p>
      <p>Username: {username}</p>
      <h3>Players:</h3>
      <ul>
        {players.map((player) => (
          <li key={player.id}>{player.username}</li>
        ))}
      </ul>
      <button onClick={handleStartGame}>Start Game</button>
      <button onClick={handleLeaveGame}>Disband Game</button>
    </div>
  );

};

export default HostRoom;