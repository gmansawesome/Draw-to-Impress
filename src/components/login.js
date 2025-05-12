import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from './apiConfig';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch(`${API_BASE}/login`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'Username': username,
          'Password': password
        }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        onLogin({
          username: data.username,
          role: data.role,
          name: data.name,
          id: data.id
        });
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Backend server not responding. Please try again later.');
      console.error('Login error:', err);
    }
  };

  return (
    
    <div className='form-pink-background'>
        <div className="vertical">
          <img src="/Images/Title.png" width="1024px" height="196px"/>

      <div className="login-container">
        <h2>Login</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="Username"
              pattern="^[a-zA-Z0-9_]{3,20}$"
              title="Username must be 3-20 characters: letters, numbers, or underscores"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="Password"
              pattern="^[a-zA-Z0-9]{1,50}$"
              title="Password must be 1 to 50 letters or numbers"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit">Login</button>
        </form>
        <div className="signup-link">
          <p>Don't have an account? <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>Sign up</a></p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Login;