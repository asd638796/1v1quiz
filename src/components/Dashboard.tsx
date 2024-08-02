import React, { useState } from 'react';
import CustomQuiz from './CustomQuiz';
import DefaultQuiz from './DefaultQuiz';

const Dashboard = (): React.JSX.Element => {
  const [selectedOption, setSelectedOption] = useState<'custom' | 'default' | null>(null);

  return (
    <div className="dashboard">
      <h2>Select Quiz Type</h2>
      <button onClick={() => setSelectedOption('custom')}>Create Custom Quiz</button>
      <button onClick={() => setSelectedOption('default')}>Use Default Quiz</button>

      {selectedOption === 'custom' && <CustomQuiz />}
      {selectedOption === 'default' && <DefaultQuiz />}
    </div>
  );
};

export default Dashboard;
