import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Logout({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    setUser(null);
    navigate('/');
  }, [setUser, navigate]);

  return null;
}

export default Logout;