import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Question {
  country: string;
  capital: string;
}

interface LocationState {
  opponent: string;
  firstTurn: boolean;
}

const Game = (): React.JSX.Element => {
  const { socket } = useSocket();
  const { username } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [timers, setTimers] = useState({ myTime: 30, opponentTime: 30 });
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [opponent, setOpponent] = useState<string>('');
  const [room, setRoom] = useState<string>('');

  
  

  useEffect(() => {
    const state = location.state as LocationState; // Type casting
    if (state) {
      const { opponent, firstTurn } = state;
      setOpponent(opponent);
      setIsPlayerTurn(firstTurn);
      const sortedUsernames = [username, opponent].sort();
      const room = `${sortedUsernames[0]}-${sortedUsernames[1]}`;
      setRoom(room);
      let apiUsername : string | null = '';
      if(firstTurn){
        apiUsername = username;
      }else{
        apiUsername = opponent;
      }

      const fetchQuestions = async () => {
        const response = await axios.get('/api/get-questions', {params: {username: apiUsername,},});
        setQuestions(response.data);
        setCurrentQuestion(response.data[0]);
      };
      fetchQuestions();
    }

    if (socket) {
      socket.on('timer_update', ({ myTime, opponentTime }) => {
        
        setTimers({ myTime: myTime, opponentTime: opponentTime });
      });

      socket.on('next_turn', ({ question }) => {
        setIsPlayerTurn((prev) => !prev);
        setCurrentQuestion(question);
        console.log('turn worked');
      });

      socket.on('game_over', ({ winner, loser }) => {
        alert(`${winner} wins! ${loser} loses.`);
        navigate('/dashboard');
      });

      return () => {
        socket.off('timer_update');
        socket.off('next_turn');
        socket.off('game_over');
      
      };
    }
  }, [socket, location.state, navigate, username]);

  const handleAnswer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    

    if (isPlayerTurn && answer.trim().toLowerCase() === currentQuestion?.capital.toLowerCase()) {
      const nextQuestion = questions[Math.floor(Math.random() * questions.length)];
      setAnswer('');
      
      socket?.emit('next_turn', { question: nextQuestion, room: room });
      
    }
  };

  return (
    <div className="game">
      <div className="timer">
        <p>Your Time: {timers.myTime}s</p>
        <p>{opponent}'s Time: {timers.opponentTime}s</p>
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
