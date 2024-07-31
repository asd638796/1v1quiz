import React, {useState, useEffect} from 'react';

interface Question {
  country: string;
  capital: string;
}


const App= () : React.JSX.Element => {
  
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
    fetch('/questions.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setQuestions(data);
        setQuestion(data[0]);
      })
      .catch((error) => {
        console.error('There has been a problem with your fetch operation:', error);
      });
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

export default App
