import React, { useState, useEffect } from 'react';
import CustomQuiz from './CustomQuiz';
import DefaultQuiz from './DefaultQuiz';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = (): React.JSX.Element => {
  const [selectedOption, setSelectedOption] = useState<'custom' | 'default' | null>(null);
  const { username, token, logout } = useAuth();
  const { disconnect } = useSocket();
  const navigate = useNavigate();
  

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout', { username }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      disconnect();
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  
  return (
    <div className="dashboard">
      <h2>Select Quiz Type</h2>
      <button onClick={() => setSelectedOption('custom')}>Create Custom Quiz</button>
      <button onClick={() => setSelectedOption('default')}>Use Default Quiz</button>
      <button onClick={handleLogout}>Logout</button>
      {selectedOption === 'custom' && <CustomQuiz />}
      {selectedOption === 'default' && <DefaultQuiz />}
    </div>
  );
};

export default Dashboard;
