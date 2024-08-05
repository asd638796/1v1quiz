import React, { useState, useEffect } from 'react';
import CustomQuiz from './CustomQuiz';
import DefaultQuiz from './DefaultQuiz';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = (): React.JSX.Element => {
  const [selectedOption, setSelectedOption] = useState<'custom' | 'default' | null>(null);
  const { username, logout } = useAuth();
  const { disconnect } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      event.preventDefault(); // Standard browsers
      await axios.post('/api/logout', { username }, { withCredentials: true });
      disconnect();
      logout();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [username, disconnect, logout]);
  

  const handleLogout = async () => {
    if (username) {
      try {
        await axios.post('/api/logout', { username }, { withCredentials: true });
        disconnect();
        logout();
        navigate('/');
      } catch (error) {
        console.error('Error logging out:', error);
      }
    } else {
      console.error('Username or token is null');
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
