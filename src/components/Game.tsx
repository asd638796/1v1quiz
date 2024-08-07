import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Question {
  country: string;
  capital: string;
}

const Game = (): React.JSX.Element => {
  const { socket } = useSocket();
  const { username } = useAuth();
  const navigate = useNavigate();
  const [timers, setTimers] = useState({ player: 30, opponent: 30 });
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [opponent, setOpponent] = useState('');
  const location = useLocation();

  useEffect(() => {
    const fetchQuestions = async () => {
      const response = await axios.get('/api/questions');
      setQuestions(response.data);
      setCurrentQuestion(response.data[0]);
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (socket) {
      
      if (location.state) {
        const { opponent, firstTurn } = location.state;
        setOpponent(opponent);
        setIsPlayerTurn(firstTurn);
      }

      socket.on('next_turn', ({question, opponent}) => {
        if(opponent == username){
          setIsPlayerTurn(true);
          setCurrentQuestion(question);
        }
        
      });

      socket.on('game_over', (data) => {
        alert(`${data.winner} wins! ${data.loser} loses.`);
        navigate('/dashboard');
      });

      return () => {
        socket.off('start_game');
        socket.off('next_turn');
        socket.off('game_over');
      };
    }
  }, [socket, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const newTimers = { ...prev };
        if (isPlayerTurn) {
          newTimers.player = Math.max(prev.player - 1, 0);
        } else {
          newTimers.opponent = Math.max(prev.opponent - 1, 0);
        }
        return newTimers;
      });
      
      if (!isPlayerTurn && timers.opponent === 0) {
        clearInterval(interval);
        const winner = username;
        const loser = opponent;
        socket?.emit('game_over', { winner, loser });
        navigate('/dashboard');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlayerTurn, timers, socket, username, opponent, navigate]);

  const handleAnswer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPlayerTurn && answer.trim().toLowerCase() === currentQuestion?.capital.toLowerCase()) {
      const nextQuestion = questions[Math.floor(Math.random() * questions.length)];
      setAnswer('');
      setIsPlayerTurn(false);
      socket?.emit('next_turn', { opponent: opponent , question: nextQuestion });
    }
  };

  return (
    <div className="game">
      <div className="timer">
        <p>Your Time: {timers.player}s</p>
        <p>{opponent}'s Time: {timers.opponent}s</p>
      </div>
      <div className={`app-body ${!isPlayerTurn ? 'disabled' : ''}`}>
        <h2 className="app-question">{currentQuestion?.country}</h2>
        <form className="app-form" onSubmit={handleAnswer}>
          <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={!isPlayerTurn} />
          <button type="submit" disabled={!isPlayerTurn}>Enter</button>
        </form>
      </div>
    </div>
  );
};

export default Game;
