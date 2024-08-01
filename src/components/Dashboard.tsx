import React, {useState} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Question {
    country: string;
    capital: string;
}



const Dashboard = (): React.JSX.Element => {

    const navigate = useNavigate();
    const [questions, setQuestions] = useState<Question[]>([{country: '', capital: ''}]);

    const handleChange = (index: number, field: 'country' | 'capital', value: string) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleSave = async () => {
        try {
          const response = await axios.post('/api/save-questions', questions);
          alert(response.data.message);
        } catch (error) {
          console.error('Error saving questions:', error);
        }
    };

    const handleAddQuestion = () => {
        setQuestions([...questions, { country: '', capital: '' }]);
    };
    
    const handleStartGame = () => {
        navigate('/game');
    };

    return (
        <div className="dashboard">
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
        <button onClick={handleStartGame}>Start Game</button>
        </div>
    );
};

export default Dashboard