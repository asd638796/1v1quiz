import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Login = (): React.JSX.Element => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { connect } = useSocket();

  const handleLogin = async () => {
    try {
      const response = await axios.post('/api/login', { username }, { withCredentials: true });
      login(username);
      connect();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };
  

  return (
    <div className="login">
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
