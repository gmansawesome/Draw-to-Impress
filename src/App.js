import './App.css';
import { useState } from 'react';
import { Navigate, useNavigate, BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/login';
import Signup from './components/signup';
import Logout from './components/logout';
import Lobby from './components/lobby';
import PrivateRoute from './components/privateroute';
import PlayerRoom from './components/playerroom';
import HostRoom from './components/hostroom';
import socket from './components/socket';
import Whiteboard from './components/whiteboard';
import BufferPage from './components/bufferpage';
import VotePage from './components/votepage';

function AppContent() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (userData) => {
    setUser(userData);
    try {
      const response = await fetch('http://localhost:5000/check-active-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id }),
        credentials: 'include'
      });
  
      const data = await response.json();
  
      if (data.inGame) {
        socket.emit("rejoin_game", { userId: userData.id, code: data.gameCode });

        socket.once("game_state", (data) => {
          if (data.state === 'submission') {
            navigate(`/${userData.username}/${data.gameCode}/buffer`);
          }
          else if (data.state === 'voting') {
            navigate(`/${userData.username}/${data.gameCode}/vote`);
          }
          else {
            const path = data.role === 'host'
              ? `/${userData.username}/host/${data.gameCode}`
              : `/${userData.username}/player/${data.gameCode}`;
            navigate(path);
          }
        });
      } 
      else {
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
        <Route path="/:username/player/:gameCode" element={<PrivateRoute user={user}> <PlayerRoom user={user} /> </PrivateRoute>} />
        <Route path="/:username/:gameCode/whiteboard" element={<PrivateRoute user={user}> <Whiteboard user={user} /> </PrivateRoute>} />
        <Route path="/:username/:gameCode/buffer" element={<PrivateRoute user={user}> <BufferPage user={user} /> </PrivateRoute>} />
        <Route path="/:username/:gameCode/vote" element={<PrivateRoute user={user}> <VotePage user={user} /> </PrivateRoute>} />
      </Routes>

    </div>
  );
}

// App component with router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
