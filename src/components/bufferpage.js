import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from './socket';

const BufferPage = () => {
  const { username, gameCode } = useParams();
  const navigate = useNavigate();
  const [dots, setDots] = useState('.');

  // simple dot animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '.' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    socket.once('game_state', (data) => {
      if (data.state === 'voting') {
        navigate(`/${username}/${gameCode}/vote`);
      }
    });

    return () => {
      socket.off('game_state');
    };
  }, [gameCode, username, navigate]);

  return (
    <div className="buffer-container">
      <h2>Collecting drawings{dots}</h2>
    </div>
  );
};

export default BufferPage;