import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://127.0.0.1:5000/login', { 
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
      <div className="login-container">
        <h2>Login</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>
        <div className="signup-link">
          <p>Don't have an account? <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>Sign up</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;