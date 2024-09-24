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
  const [quizType, setQuizType] = useState<'custom' | 'default' | null>('default');
  const [gameDuration, setGameDuration] = useState<number>(30); 
  const [skipPenalty, setSkipPenalty] = useState<number>(2);
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


  return (
    <div className="dashboard">
      
      <Navbar gameDuration={gameDuration} skipPenalty={skipPenalty} />

      <button onClick={handleLogout}>Logout</button>
      
      <div className="question-settings">
      <h2>Question Settings</h2>
        <label>
          Game Duration (seconds):
          <input
            type="number"
            value={gameDuration}
            onChange={(e) => setGameDuration(Number(e.target.value))}
            min="30"
          />
        </label>
        <label>
          Skip Penalty (seconds):
          <input
            type="number"
            value={skipPenalty}
            onChange={(e) => setSkipPenalty(Number(e.target.value))}
            min="0"
          />
        </label>
      </div>
      
      <div className="game-settings">
        <h2>Game Settings</h2>
        <button onClick={() => setSelectedOption('custom')}>Create Custom Quiz</button>
        <button onClick={() => setSelectedOption('default')}>Use Default Quiz</button>
        {selectedOption === 'custom' && <CustomQuiz setQuizType={setQuizType} />}
        {selectedOption === 'default' && <DefaultQuiz setQuizType={setQuizType} />}
      </div>

    </div>

  );
};

export default Dashboard;
