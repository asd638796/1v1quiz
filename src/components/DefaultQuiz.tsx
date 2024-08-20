import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';


const DefaultQuiz = ({ setQuizType }: { setQuizType: (type: 'custom' | 'default') => void}): React.JSX.Element => {
  
  interface Question {
    
    country: string;
    capital: string;

    }
      

  const [questions, setQuestions] = useState<Question[]>([]);
  const { username } = useAuth();

  useEffect(() => {
    const fetchDefaultQuestions = async () => {
      try {
        const response = await fetch('/default.json');
        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error('Error fetching default questions:', error);
      }
    };

    fetchDefaultQuestions();
  }, []);
  
  const handleStartGame = async () => {
    
    try {
        const response = await axios.post('/api/save-questions', {questions, username});
        alert(response.data.message);
        setQuizType('default'); 
    } catch (error) {
        console.error('Error saving questions:', error);
    }
      
  };

  return (
    <div className="default-quiz">
      <h2>Use Default Questions</h2>
      <button onClick={handleStartGame}>Save questions</button>
    </div>
  );
};

export default DefaultQuiz;
