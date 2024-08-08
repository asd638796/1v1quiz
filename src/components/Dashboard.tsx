import React, { useState, useEffect, useCallback } from 'react';
import CustomQuiz from './CustomQuiz';
import DefaultQuiz from './DefaultQuiz';
import { useNavigate } from 'react-router-dom';
import Navbar from './NavBar';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = (): React.JSX.Element => {
  const [selectedOption, setSelectedOption] = useState<'custom' | 'default' | null>(null);
  const { username, logout } = useAuth();
  const { disconnect } = useSocket();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
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
      console.error('Username is null');
    }
  }, [username, disconnect, logout, navigate]);


  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault(); // Standard browsers
      handleLogout(); // Call handleLogout to ensure proper cleanup
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleLogout]);

  
  
  return (
    <div className="dashboard">
      <Navbar />
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
