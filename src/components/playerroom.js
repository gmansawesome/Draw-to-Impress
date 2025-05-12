import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from './socket';
import API_BASE from './apiConfig';

const PlayerRoom = ({ user }) => {
  const { username, gameCode } = useParams();
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit('rejoin_game', {
      userId: user.id,
      code: gameCode,
    });

    socket.on('player_list', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('game_state', (data) => {
      if (data.state === 'whiteboard') {
        navigate(`/${username}/${gameCode}/whiteboard`, {
          state: { prompt: data.prompt, duration: data.duration }
        });
      }
    });

    socket.on('game_closed', () => {
      navigate('/lobby');
    });

    return () => {
      socket.off('player_list');
      socket.off('game_state');
      socket.off('game_closed');
    };
  }, [user.id, gameCode, username, navigate]);

  const handleLeaveGame = async () => {
    try {
      const response = await fetch(`${API_BASE}/game/${username}/${gameCode}`, {
        method: 'DELETE',
        credentials: 'include',
      });
  
      const data = await response.json();
      if (data.success) {
        socket.emit('leave_room', { gameCode });
        navigate(`/lobby`);
      } else {
        alert(data.message || 'Failed to leave game.');
      }
    } catch (err) {
      console.error("Error leaving game:", err);
      alert("Server error. Try again later.");
    }
  };

  return (
    <div className="lobby-container">
    <div className="join-section">
      <h2>Game Lobby</h2>
      <p>Game Code: {gameCode}</p>
      <h3>Players:</h3>
      <ul className="player-list">
        {players.map((player) => (
          <li key={player.id} className="player-item">
            {player.username}
          </li>
        ))}
      </ul>
      <button className='regular' onClick={handleLeaveGame}>Leave Game</button>
      <p>Waiting for host to start the game...</p>
    </div>
    </div>
  );
};

export default PlayerRoom;