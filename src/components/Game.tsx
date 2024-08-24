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
  const location = useLocation();
  const navigate = useNavigate();
  const [timers, setTimers] = useState({ myTime: 30, opponentTime: 30 });
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [opponent, setOpponent] = useState<string>('');
  const [room, setRoom] = useState<string>('');

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const roomFromUrl = query.get('room');

    if (roomFromUrl) {
      setRoom(roomFromUrl);

      // Fetch game state from the server
      const fetchGameState = async () => {
        try {
          const response = await axios.get('/api/game-state', { params: { room: roomFromUrl } });
          const { myTime, opponentTime, isPlayerTurn, question, players } = response.data;
          
          setTimers({ myTime, opponentTime });
          setIsPlayerTurn(isPlayerTurn === username); // Check if it's the user's turn
          setCurrentQuestion(question);
          setOpponent(players.from === username ? players.to : players.from); // Set opponent's name
        } catch (error) {
          console.error('Failed to fetch game state:', error);
          navigate('/dashboard'); // Redirect if game state fetch fails
        }
      };

      fetchGameState();
    } else {
      console.error('No room found in URL');
      navigate('/dashboard'); // Redirect if no room found in URL
    }
  }, [location.search, navigate, username]);

  useEffect(() => {
    if (socket) {
      socket.on('timer_update', ({ myTime, opponentTime }) => {
        setTimers({ myTime, opponentTime });
      });

      socket.on('next_turn', ({ question }) => {
        setIsPlayerTurn((prev) => !prev);
        setCurrentQuestion(question);
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
  }, [socket, navigate]);

  const handleAnswer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isPlayerTurn && answer.trim().toLowerCase() === currentQuestion?.capital.toLowerCase()) {
      const nextQuestion = currentQuestion; // You will need to determine the next question logic
      setAnswer('');
      socket?.emit('next_turn', { question: nextQuestion, room });
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
