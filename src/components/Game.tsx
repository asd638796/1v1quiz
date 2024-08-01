import React, {useState, useEffect} from 'react';
import axios from 'axios';


interface Question {
  country: string;
  capital: string;
}


const Game= () : React.JSX.Element => {
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [question, setQuestion] = useState<Question>();
  const [answer, setAnswer] = useState<string>('');
  

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (answer.trim().toLowerCase() === question?.capital.toLowerCase()) {
      const index: number = Math.floor(Math.random() * questions.length);
      setQuestion(questions[index]);
      setAnswer('');
    
    } 
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get('/api/questions');
        setQuestions(response.data);
        setQuestion(response.data[0]);
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };

    fetchQuestions();
  }, []);


  return (
    <>
      <div className='app-body'>
        <h2 className='app-question'>{question?.country}</h2>
        <form className='app-form' onSubmit={handleSubmit}>  
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}          
            />
          <button type="submit">Enter</button>
        </form>
      </div>
    </>
  )
}

export default Game
