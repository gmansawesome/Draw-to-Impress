import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from './apiConfig';

function Signup() {
  const [formData, setFormData] = useState({
    FirstName: '',
    LastName: '',
    Username: '',
    Password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(formData).toString()
    });

    const result = await response.json();

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Signup failed.');
    }
  };

  return (
    <div className="form-pink-background">
      <div className="form-container">
        <h2>Sign Up</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit} autoComplete="off">
          <label>First Name:</label>
          <input
            type="text"
            name="FirstName"
            pattern="^[A-Za-z]{1,50}$"
            title="First name must only contain letters"
            required
            value={formData.FirstName}
            onChange={handleChange}
          />

          <label>Last Name:</label>
          <input
            type="text"
            name="LastName"
            pattern="^[A-Za-z]{1,50}$"
            title="Last name must only contain letters"
            required
            value={formData.LastName}
            onChange={handleChange}
          />

          <label>Username:</label>
          <input
            type="text"
            name="Username"
            pattern="^[a-zA-Z0-9_]{3,20}$"
            title="Username must be 3-20 characters: letters, numbers, or underscores"
            required
            value={formData.Username}
            onChange={handleChange}
          />

          <label>Password:</label>
          <input
            type="password"
            name="Password"
            pattern="^[a-zA-Z0-9]{1,50}$"
            title="Password must be 1 to 50 letters or numbers"
            required
            value={formData.Password}
            onChange={handleChange}
          />

          <button type="submit">Sign Up</button>
        </form>
        <p>
          Already have an account? <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Log in</a>
        </p>
      </div>
    </div>
  );
}

export default Signup;