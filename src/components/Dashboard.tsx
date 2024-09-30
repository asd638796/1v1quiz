import React, { useState, useCallback, useEffect } from 'react';
import CustomQuiz from './CustomQuiz';
import DefaultQuiz from './DefaultQuiz';
import { useNavigate } from 'react-router-dom';
import Navbar from './NavBar';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useRecoilState, useResetRecoilState } from 'recoil';
import { quizTypeState, questionsState } from '../recoil/atom';

const Dashboard = (): React.JSX.Element => {
  const [selectedQuizType, setSelectedQuizType] = useState<'custom' | 'default' | null>(null)
  const [gameDuration, setGameDuration] = useState<string>('30'); 
  const [skipPenalty, setSkipPenalty] = useState<string>('2');
  const [quizType, setQuizType] = useRecoilState(quizTypeState);
  const resetQuizType = useResetRecoilState(quizTypeState);
  const resetquestionState = useResetRecoilState(questionsState);

  const { username, logout  } = useAuth();
  const { disconnect } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedQuizType(quizType);
  }, []);
  

  const handleLogout = useCallback(async () => {
    if (username) {
      try {
        await axios.post('/api/logout', { username }, { withCredentials: true });
        disconnect();
        logout();
        navigate('/');
        resetQuizType();
        resetquestionState();
      } catch (error) {
        console.error('Error logging out:', error);
      }
    } else {
      console.error('Username is null');
    }
  }, [username, disconnect, logout, navigate]);

  
  return (
    <div className="dashboard">
      
      <Navbar gameDuration={parseInt(gameDuration)} skipPenalty={parseInt(skipPenalty)} />

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
              type="text" // Use text to allow partial inputs
              maxLength={3} // Allow an extra character for user flexibility
              value={gameDuration}
              onChange={(e) => setGameDuration(e.target.value)}
              onBlur={() => {
                const max = 120;
                const min = 15;
                if (gameDuration === '') {
                  setGameDuration(min.toString()); // Default to min if empty
                  return;
                }

                const parsedValue = parseInt(gameDuration, 10);

                if (isNaN(parsedValue)) {
                  setGameDuration(min.toString()); // Default to min if invalid
                  return;
                }

                // Clamp the value between min and max
                const clampedValue = Math.min(max, Math.max(min, parsedValue));
                setGameDuration(clampedValue.toString());
              }}
              className="flex-grow mt-1 p-2 border border-gray-300 rounded"
              placeholder={`15-120`}
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
              type="text" // Use text to allow partial inputs
              maxLength={2} // Allow an extra character for user flexibility
              value={skipPenalty}
              onChange={(e) => setSkipPenalty(e.target.value)}
              onBlur={() => {
                const max = 30;
                const min = 0;
                if (skipPenalty === '') {
                  setSkipPenalty(min.toString()); // Default to min if empty
                  return;
                }

                const parsedValue = parseInt(skipPenalty, 10);

                if (isNaN(parsedValue)) {
                  setSkipPenalty(min.toString()); // Default to min if invalid
                  return;
                }

                // Clamp the value between min and max
                const clampedValue = Math.min(max, Math.max(min, parsedValue));
                setSkipPenalty(clampedValue.toString());
              }}
              className="flex-grow mt-1 p-2 border border-gray-300 rounded"
              placeholder={`0-30`}
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
