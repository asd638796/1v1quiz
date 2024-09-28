import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';


interface DefaultQuizProps {
  setQuizType: (type: 'custom' | 'default') => void;
  quizType: 'custom' | 'default' | null;
}

interface Question {
    
  country: string;
  capital: string;

  }

const DefaultQuiz = ({ setQuizType, quizType }: DefaultQuizProps): React.JSX.Element => { 
      

 
  const { username } = useAuth();

  useEffect(() => {
    const fetchAndStart = async () => {
      
      try {
        const response = await fetch('/default.json');
        const questions = await response.json();
        const saveResponse = await axios.post('/api/save-questions', {questions, username}, { withCredentials: true });
        alert(saveResponse.data.message);
        setQuizType('default'); 
      } catch (error) {
        console.error('Error fetching or saving questions:', error);
      }
    };
    
    if(quizType === 'custom'){
      fetchAndStart();
    }
    
  }, []);
  
 
  return <div></div>;
  
};

export default DefaultQuiz;
