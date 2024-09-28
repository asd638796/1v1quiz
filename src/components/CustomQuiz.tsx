import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Question {
  country: string;
  capital: string;
}

interface CustomQuizProps {
  setQuizType: (type: 'custom' | 'default') => void;
}

const CustomQuiz = ({setQuizType}: CustomQuizProps): React.JSX.Element => {
  // Initialize with one row of 5 questions
  const [questions, setQuestions] = useState<Question[][]>([
    [
      { country: '', capital: '' },
      { country: '', capital: '' },
      { country: '', capital: '' },
      { country: '', capital: '' },
      { country: '', capital: '' },
    ],
  ]);

  

  const { username } = useAuth();

  // Handle adding a new question (fills existing rows first)
  const handleAddQuestion = () => {
    setQuestions((prevQuestions) => {
      // Find the first row with less than 5 questions
      for (let i = 0; i < prevQuestions.length; i++) {
        if (prevQuestions[i].length < 5) {
          const updatedRow = [...prevQuestions[i], { country: '', capital: '' }];
          const updatedQuestions = [...prevQuestions];
          updatedQuestions[i] = updatedRow;
          return updatedQuestions;
        }
      }
      // If all existing rows are full, add a new row
      return [...prevQuestions, [{ country: '', capital: '' }]];
    });
  };

  // Handle deleting a question from a specific row and index
  const handleDeleteQuestion = (rowIndex: number, questionIndex: number) => {
    if (rowIndex === 0) return; // Prevent deleting from the first row

    const newQuestions = [...questions];
    newQuestions[rowIndex].splice(questionIndex, 1);

    // If the row becomes empty after deletion, remove the row
    if (newQuestions[rowIndex].length === 0) {
      newQuestions.splice(rowIndex, 1);
    }

    setQuestions(newQuestions);
  };

  // Handle input changes with leading zero prevention
  const handleChange = (
    rowIndex: number,
    questionIndex: number,
    field: 'country' | 'capital',
    value: string
  ) => {
    const newQuestions = [...questions];
    newQuestions[rowIndex][questionIndex][field] = value;
    setQuestions(newQuestions);
  };

  // Handle saving questions
  const handleSave = async () => {
    // Optional: Validate that all questions have both country and capital filled
    for (const row of questions) {
      for (const q of row) {
        if (!q.country.trim() || !q.capital.trim()) {
          alert('Please fill in all question and answer fields.');
          return;
        }
      }
    }

    try {
      const flatQuestions = questions.flat(); // Flatten the 2D array
      const response = await axios.post('/api/save-questions', {
        username,
        questions: flatQuestions,
      });
      alert(response.data.message);
      setQuizType('custom');
    } catch (error) {
      console.error('Error saving questions:', error);
      alert('Failed to save questions. Please try again.');
    }
  };

  return (
    <div className="custom-quiz bg-white p-6 rounded-lg  mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Your Questions</h2>

      {/* Questions Container */}
      <div className="space-y-6">
        {questions.map((row, rowIndex) => (
          <div key={rowIndex} className="flex space-x-6">
            {row.map((question, questionIndex) => (
              <div
                key={questionIndex}
                className="relative w-60 h-60 bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 group"
              >
                {/* Delete Button (only for rows beyond the first) */}
                {rowIndex > 0 && (
                  <button
                    onClick={() => handleDeleteQuestion(rowIndex, questionIndex)}
                    className="absolute top-2 right-2 text-red-500 bg-white rounded-full hover:bg-red-100 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    aria-label="Delete Question"
                  >
                    &times;
                  </button>
                )}

                {/* Question Input */}
                <div className="flex flex-col mb-4">
                  <label
                    htmlFor={`country-${rowIndex}-${questionIndex}`}
                    className="mb-1 text-gray-700 font-semibold"
                  >
                    Question:
                  </label>
                  <input
                    id={`country-${rowIndex}-${questionIndex}`}
                    type="text"
                    placeholder="Enter Question"
                    value={question.country}
                    onChange={(e) =>
                      handleChange(rowIndex, questionIndex, 'country', e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Answer Input */}
                <div className="flex flex-col">
                  <label
                    htmlFor={`capital-${rowIndex}-${questionIndex}`}
                    className="mb-1 text-gray-700 font-semibold"
                  >
                    Answer:
                  </label>
                  <input
                    id={`capital-${rowIndex}-${questionIndex}`}
                    type="text"
                    placeholder="Enter Answer"
                    value={question.capital}
                    onChange={(e) =>
                      handleChange(rowIndex, questionIndex, 'capital', e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add and Save Buttons */}
      <div className="flex space-x-4 mt-6 justify-center">
        <button
          onClick={handleAddQuestion}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Question
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default CustomQuiz;
