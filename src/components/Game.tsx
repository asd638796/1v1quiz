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
  const [isPlayerTurn, setIsPlayerTurn] = useState<string | null>('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [opponent, setOpponent] = useState<string>('');
  const [room, setRoom] = useState<string>('');

  // Use a loading state to handle the initial socket null value
  const [loading, setLoading] = useState(true);

  const handleSocketConnect = async (socket:any) => {
    const query = new URLSearchParams(location.search);
    const roomFromUrl = query.get('room');

    if (roomFromUrl) {
      setRoom(roomFromUrl);

      try {
        const response = await axios.get('/api/game-state', { params: { room: roomFromUrl } });
        const { timers, isPlayerTurn, question, players } = response.data;

        if (username === players.from) {
          setTimers({ myTime: timers[players.from], opponentTime: timers[players.to] });
        } else {
          setTimers({ myTime: timers[players.to], opponentTime: timers[players.from] });
        }

        setIsPlayerTurn(isPlayerTurn);
        setCurrentQuestion(question);
        setOpponent(players.from === username ? players.to : players.from);

        // Rejoin the room on the server side
        socket.emit('join_room', { room: roomFromUrl, username });
      } catch (error) {
        console.error('Failed to fetch game state:', error);
        navigate('/dashboard'); // Redirect if game state fetch fails
      }
    } else {
      console.error('No room found in URL');
      navigate('/dashboard'); // Redirect if no room found in URL
    }
  };

  useEffect(() => {
    if (!socket) {
      setLoading(true);
      return;
    }else{
      handleSocketConnect(socket);
      setLoading(false);
    }
  
    if (!loading) {
      socket.on('timer_update', ({ from, to, timers }) => {
        if (username === from) {
          setTimers({ myTime: timers[from], opponentTime: timers[to] });
        } else {
          setTimers({ myTime: timers[to], opponentTime: timers[from] });
        }
      });
  
      socket.on('next_turn', ({ question, isPlayerTurn }) => {
        setIsPlayerTurn(isPlayerTurn);
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
  }, [socket, loading, navigate, username, room]);
  

  if (loading) {
    return <div>Loading...</div>;  // Show a loading state while the socket is connecting
  }

  const handleAnswer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isPlayerTurn === username && answer.trim().toLowerCase() === currentQuestion?.capital.toLowerCase()) {
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
      <div className={`app-body ${!(isPlayerTurn === username) ? 'disabled' : ''}`}>
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
