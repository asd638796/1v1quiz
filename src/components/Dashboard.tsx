import React, { useState, useCallback } from 'react';
import CustomQuiz from './CustomQuiz';
import DefaultQuiz from './DefaultQuiz';
import { useNavigate } from 'react-router-dom';
import Navbar from './NavBar';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = (): React.JSX.Element => {
  const [quizType, setQuizType] = useState<'custom' | 'default' | null>('default');
  const [selectedQuizType, setSelectedQuizType] = useState<'custom' | 'default' | null>('default')
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
        className="ml-4 mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>
      
      <div className="flex flex-col items-center justify-center question-settings bg-white p-6 rounded-md  mt-10">
        <h2 className="text-xl font-bold mb-4">Game Settings</h2>

       
          {/* Game Duration Input */}
          <div className="mb-4 flex items-center">
            <label className="w-48 text-gray-700 font-bold" htmlFor="gameDuration">
              Game Duration (seconds):
            </label>
            <input
              id="gameDuration"
              name="gameDuration"
              type="number"
              min="15"
              value={Number(gameDuration).toString()}
              onChange={(e) => {
                let value = e.target.value;
          
                // Remove any non-digit characters
                value = value.replace(/\D/g, '');
          
                // Remove leading zeros unless the value is '0'
                if (value.length > 1) {
                  value = value.replace(/^0+/, '');
                }
          
                // If value is empty, set skipPenalty to 0
                if (value === '') {
                  setGameDuration(0);
                } else {
                  // Parse the value to an integer
                  let numValue = parseInt(value, 10);
          
                  // Clamp the value between 0 and 30
                  numValue = Math.max(0, Math.min(numValue, 120));
          
                  setGameDuration(numValue);
                }
              }}
              className="flex-grow mt-1 p-2 border border-gray-300 rounded"
            />
          </div>

          {/* Skip Penalty Input */}
          <div className="mb-4 flex items-center">
            <label className="w-48 text-gray-700 font-bold" htmlFor="skipPenalty">
              Skip Penalty (seconds):
            </label>
            <input
              id="skipPenalty"
              name="skipPenalty"
              type="number"
              value={Number(skipPenalty).toString()}
              onChange={(e) => {
                let value = e.target.value;
          
                // Remove any non-digit characters
                value = value.replace(/\D/g, '');
          
                // Remove leading zeros unless the value is '0'
                if (value.length > 1) {
                  value = value.replace(/^0+/, '');
                }
          
                // If value is empty, set skipPenalty to 0
                if (value === '') {
                  setSkipPenalty(0);
                } else {
                  // Parse the value to an integer
                  let numValue = parseInt(value, 10);
          
                  // Clamp the value between 0 and 30
                  numValue = Math.max(0, Math.min(numValue, 30));
          
                  setSkipPenalty(numValue);
                }
              }}
              className="flex-grow mt-1 p-2 border border-gray-300 rounded"
            />
          </div>

        {/* Buttons for Custom and Default Questions */}
        <div className="mt-6">
          <button
            onClick={() => {setSelectedQuizType('custom')}}
            className={`mr-4 px-4 py-2 rounded ${
              selectedQuizType === 'custom'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors duration-200`}
          >
            Create Custom Questions
          </button>
          <button
            onClick={() => {setSelectedQuizType('default')}}
            className={`px-4 py-2 rounded ${
              selectedQuizType === 'default'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors duration-200`}
          >
            Use Default Questions
          </button>
        </div>

        {/* Render CustomQuiz or DefaultQuiz based on selection */}
        {selectedQuizType === 'custom' && <CustomQuiz setQuizType={setQuizType} />}
        {selectedQuizType === 'default' && <DefaultQuiz setQuizType={setQuizType} quizType={quizType} />}
      </div>
    </div>

  );
};

export default Dashboard;
