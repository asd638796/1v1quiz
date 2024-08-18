import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Question {
  country: string;
  capital: string;
}

const CustomQuiz = (): React.JSX.Element => {
  const [questions, setQuestions] = useState<Question[]>([{ country: '', capital: '' }]);
  const { username } = useAuth();

  const handleAddQuestion = () => {
    setQuestions([...questions, { country: '', capital: '' }]);
  };

  const handleChange = (index: number, field: 'country' | 'capital', value: string) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    try {
      const response = await axios.post('/api/save-questions', {username, questions});
      alert(response.data.message);
    } catch (error) {
      console.error('Error saving questions:', error);
    }
  };

 

  return (
    <div className="custom-quiz">
      <h2>Create Your Questions</h2>
      {questions.map((question, index) => (
        <div key={index} className="question-form">
          <input
            type="text"
            placeholder="Country"
            value={question.country}
            onChange={(e) => handleChange(index, 'country', e.target.value)}
          />
          <input
            type="text"
            placeholder="Capital"
            value={question.capital}
            onChange={(e) => handleChange(index, 'capital', e.target.value)}
          />
        </div>
      ))}
      <button onClick={handleAddQuestion}>Add Question</button>
      <button onClick={handleSave}>Save</button>
      
    </div>
  );
};

export default CustomQuiz;
