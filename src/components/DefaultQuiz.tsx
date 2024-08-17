import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const DefaultQuiz = (): React.JSX.Element => {
  
  interface Question {
    
    country: string;
    capital: string;

    }
      

  const [questions, setQuestions] = useState<Question[]>([]);
  const navigate = useNavigate();


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
        const response = await axios.post('/api/save-questions', questions);
        alert(response.data.message);
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
