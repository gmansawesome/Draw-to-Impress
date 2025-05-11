import './App.css';
import { useState } from 'react';
import { Navigate, useNavigate, BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/login';
import Signup from './components/signup';
import Logout from './components/logout';
import Lobby from './components/lobby';
import PrivateRoute from './components/privateroute';
import HostRoom from './components/HostRoom.js';
import PlayerRoom from './components/PlayerRoom';


function AppContent() {
  
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (userData) => {
    setUser(userData);
    try {
      const response = await fetch('http://127.0.0.1:5000//check-active-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id }),
        credentials: 'include'
      });
  
      const data = await response.json();
  
      if (data.inGame) {
        const path =
          data.role === 'host'
            ? `/${userData.username}/host/${data.gameCode}`
            : `/${userData.username}/player/${data.gameCode}`;
  
        navigate(path);
      } else {
        navigate('/lobby');
      }
  
      console.log("LOGIN SUCCESS");
    } catch (err) {
      console.error("Error checking active game:", err);
      navigate('/lobby');
    }
  };

  return (
    
    <div className="App">

    {user && (
        <header className="app-header">
          <span>Welcome, {user?.username}</span>
          <button 
            onClick={() => navigate('/logout')}
            className="logout-button"
          >
            Logout
          </button>
        </header>
    )}

      <Routes>
        <Route path="/logout" element={<Logout setUser={setUser} />} />
        <Route path="/" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/lobby" element={<PrivateRoute user={user}> <Lobby user={user} /> </PrivateRoute>}/>        
        <Route path="/:username/host/:gameCode" element={<PrivateRoute user={user}> <HostRoom user={user} /> </PrivateRoute>} />
        {/* <Route path="/:username/player/:gameCode" element={<PrivateRoute user={user}> <PlayerRoom user={user} /> </PrivateRoute>} /> */}
      </Routes>

    </div>
  );
}

// App component with router
function App() {
  return (
    <Router>
      <audio autoPlay loop>
        <source src="/Music/Piano Music.mp3" type="audio/mpeg" />
      </audio>
      <AppContent />
    </Router>
  );
}

export default App;
