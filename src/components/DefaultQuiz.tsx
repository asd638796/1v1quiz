import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';


interface DefaultQuizProps {
  setQuizType: (type: 'custom' | 'default') => void;
  quizType: 'custom' | 'default' | null;
}


const DefaultQuiz = ({ setQuizType, quizType }: DefaultQuizProps): React.JSX.Element => { 
      
  const [message, setMessage] = useState<string | null>(null);
  const { username } = useAuth();

  useEffect(() => {
    const fetchAndStart = async () => {
      
      try {
        const response = await fetch('/default.json');
        const questions = await response.json();
        const saveResponse = await axios.post('/api/save-questions', {questions, username}, { withCredentials: true });
        
        setMessage(saveResponse.data.message);
        
        // Set a timeout to change quizType after the animation duration (7s)
        setTimeout(() => {
          setQuizType('default'); 
        }, 7000); // 7 seconds corresponds to the Tailwind animation duration

      } catch (error) {
        console.error('Error fetching or saving questions:', error);
      }
    };
    
    if(quizType === 'custom'){
      fetchAndStart();
    }
    
  }, []);
  
 
  return (
    <div className="custom-quiz bg-white p-6 rounded-lg mt-10">
      {/* Message Display */}
      <div className="flex flex-col items-center space-y-2 mt-6">
        {/* Reserved space to prevent layout shifts */}
        <div className="h-6 w-full">
          {message && (
            <div
              role="alert"
              aria-live="assertive"
              className={`w-full text-center text-sm font-medium animate-fadeInOut ${
                message.includes('Failed') ? 'text-red-500' : 'text-green-500'
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
};

export default DefaultQuiz;
