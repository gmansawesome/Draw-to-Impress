import React from 'react';
import { useParams } from 'react-router-dom';
import API_BASE from './apiConfig';

const VotePage = () => {
  const { username, gameCode } = useParams();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Voting Phase</h2>
      <p style={styles.text}>
        Welcome, <strong>{username}</strong>!<br />
        Game Code: <strong>{gameCode}</strong>
      </p>
      <p style={styles.subtext}>This is a placeholder for the voting interface.</p>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'sans-serif',
    textAlign: 'center',
    paddingTop: '15vh',
  },
  title: {
    fontSize: '2.5rem',
  },
  text: {
    fontSize: '1.2rem',
    marginTop: '1rem',
  },
  subtext: {
    fontSize: '1rem',
    marginTop: '2rem',
    fontStyle: 'italic',
    color: '#666',
  }
};

export default VotePage;