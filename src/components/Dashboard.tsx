import React, { useState, useEffect } from 'react';
import CustomQuiz from './CustomQuiz';
import DefaultQuiz from './DefaultQuiz';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const Dashboard = (): React.JSX.Element => {
  const [selectedOption, setSelectedOption] = useState<'custom' | 'default' | null>(null);
  const { disconnect } = useSocket();
  const navigate = useNavigate();
  

  const handleLogout = () => {
    disconnect();
    navigate('/');
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
