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

      <button
        onClick={handleLogout}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>
      
      <div className="question-settings bg-white p-6 rounded-md shadow-md mt-6">
        <h2 className="text-xl font-bold mb-4">Question Settings</h2>
        <label className="block mb-2">
          Game Duration (seconds):
          <input
            type="number"
            value={gameDuration}
            onChange={(e) => setGameDuration(Number(e.target.value))}
            min="30"
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </label>
        <label className="block mb-2">
          Skip Penalty (seconds):
          <input
            type="number"
            value={skipPenalty}
            onChange={(e) => setSkipPenalty(Number(e.target.value))}
            min="0"
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </label>
      </div>

      
      <div className="game-settings bg-white p-6 rounded-md shadow-md mt-6">
        <h2 className="text-xl font-bold mb-4">Game Settings</h2>
        <button
          onClick={() => setSelectedOption('custom')}
          className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Custom Quiz
        </button>
        <button
          onClick={() => setSelectedOption('default')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Use Default Quiz
        </button>
        {selectedOption === 'custom' && <CustomQuiz setQuizType={setQuizType} />}
        {selectedOption === 'default' && <DefaultQuiz setQuizType={setQuizType} />}
      </div>
    </div>

  );
};

export default Dashboard;
