import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API_BASE from './apiConfig';

const ResultPage = () => {
  const { username, gameCode } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const location = useLocation();
  const prompt = location.state?.prompt;

  useEffect(() => {
    fetch(`${API_BASE}/game-results/${gameCode}`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setResults(data.results);
        }
      });
  }, [gameCode]);

  return (
    <div className="form-green-background">
          <div className="vertical">

          <img src="/Images/Results.png" width="1024px" height="196px"/>
    <div style={styles.container}>
    <button style={styles.button} onClick={() => navigate('/lobby')}>
        Back to Lobby
      </button>
      <p style={styles.text}>
        Game Code: <strong>{gameCode}</strong>
      </p>
      <p style={styles.text}>
        Prompt: {prompt}
      </p>

      {results.map((result, index) => (
        <div key={result.drawingId} style={styles.resultCard}>
          <h3>#{index + 1} - {result.username}</h3>
          <p>Votes: {result.totalVotes}</p>
          <img src={result.imageData} alt="Drawing" style={styles.image} />
        </div>
      ))}
    </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'sans-serif',
    textAlign: 'center',
    // paddingTop: '5vh',
  },
  title: {
    fontSize: '2.5rem',
  },
  text: {
    fontSize: '1.2rem',
    marginTop: '1rem',
  },
  resultCard: {
    border: '1px solid #ccc',
    borderRadius: '8px',
    margin: '2rem auto',
    // padding: '1rem',
    maxWidth: '600px',
    backgroundColor: '#f9f9f9',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '8px',
  },
  button: {
    marginTop: '2rem',
    padding: '0.75rem 2rem',
    fontSize: '1rem',
    backgroundColor: '#008000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default ResultPage;
