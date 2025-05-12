import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import socket from './socket';
import API_BASE from './apiConfig';

const VotePage = ({ user }) => {
  const { username, gameCode } = useParams();
  const navigate = useNavigate();

  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedVote, setSelectedVote] = useState(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const location = useLocation();
  const prompt = location.state?.prompt;

  useEffect(() => {
    socket.on('voting_display', (data) => {
      setCurrentDrawing(data);
      setHasVoted(false);
      setSelectedVote(null);
    });

    socket.on('voting_end', (data) => {
      if (data.gameCode === gameCode) {
        navigate(`/${gameCode}/results`, {
          state: { prompt: data.prompt }
        });
      }
    });

    return () => {
      socket.off('voting_display');
      socket.off('voting_end');
    };
  }, [gameCode, navigate]);

  useEffect(() => {
    if (!currentDrawing) return;

    setTimeLeft(5);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentDrawing]);

  const handleVote = async (score) => {
    if (!currentDrawing || hasVoted) return;

    try {
      const response = await fetch(`${API_BASE}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          voterId: user.id,
          gameCode,
          drawingId: currentDrawing.drawingId,
          score: score
        })
      });

      const data = await response.json();
      if (data.success) {
        setHasVoted(true);
        setSelectedVote(score);
      } else {
        alert(data.message || 'Vote failed.');
      }
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  return (
    // <div className='form-justpink-background'>
    <div className='form-pink2-background'>
      <div className='vertical'>

      <img src="/Images/Voting.png" width="1024px" height="196px"/>
      <p>Game Code: <strong>{gameCode}</strong></p>
      <p>Prompt: {prompt}</p>

      {currentDrawing ? (
        <div className='vertical'>
          <h3>By: {currentDrawing.playerName}</h3>
          <p>Rate this drawing (1–5) | Time left: <strong>{timeLeft}s</strong></p>
          <div style={styles.buttonRow}>
            {[1, 2, 3, 4, 5].map(score => (
              <button
              key={score}
              onClick={() => handleVote(score)}
              disabled={hasVoted}
              style={
                hasVoted && selectedVote === score
                ? styles.selectedButton
                : hasVoted
                ? styles.disabledButton
                : styles.voteButton
              }
              >
                {score}
              </button>
            ))}
          </div>
          <img
            src={currentDrawing.imageData}
            alt="Drawing"
            style={styles.image}
            />
        </div>
      ) : (
        <p>Waiting for the next drawing...</p>
      )}
    </div>
    </div>
    // </div>
  );
};

const styles = {
  container: {
    fontFamily: 'sans-serif',
    textAlign: 'center',
    paddingTop: '5vh',
  },
  image: {
    backgroundColor: '#FFFFFF',
    maxWidth: '80%',
    maxHeight: '60vh',
    margin: '2rem 0',
    border: '2px solid #ccc',
    borderRadius: '8px',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    margin: '1rem 0',
  },
  voteButton: {
    fontSize: '1.5rem',
    padding: '0.6rem 1.2rem',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  disabledButton: {
    fontSize: '1.5rem',
    padding: '0.6rem 1.2rem',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'not-allowed',
  },
  selectedButton: {
    fontSize: '1.5rem',
    padding: '0.6rem 1.2rem',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'not-allowed',
  }
};

export default VotePage;