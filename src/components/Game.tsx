import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Question {
  country: string;
  capital: string;
}

interface NextTurnData {
  question: Question | null;
  isPlayerTurn: string | null;
}

interface GameOverData {
  winner: string;
  loser: string;
}

interface Timers {
  [username: string]: number;
}

interface TimerUpdateData {
  timers: Timers;
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
  const [loading, setLoading] = useState(false);

  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(5);
  const [gameOverMessage, setGameOverMessage] = useState<string>('');

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isGameOver && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isGameOver && countdown === 0) {
      navigate('/dashboard');
    }

    // Clean up the timer when the component unmounts or when countdown changes
    return () => clearTimeout(timer);
  }, [isGameOver, countdown, navigate]);

  const handleSocketConnect = async (socket: any) => {
    const query = new URLSearchParams(location.search);
    const roomFromUrl = query.get('room');

    if (roomFromUrl) {
      setRoom(roomFromUrl);

      try {
        const response = await axios.get('/api/game-state', { params: { room: roomFromUrl } });
        const { timers, isPlayerTurn, question, players } = response.data;

        let opponentUsername: string;

        if (username === players.from) {
          setTimers({ myTime: timers[players.from], opponentTime: timers[players.to] });
          opponentUsername = players.to;
        } else {
          setTimers({ myTime: timers[players.to], opponentTime: timers[players.from] });
          opponentUsername = players.from;
        }

        setIsPlayerTurn(isPlayerTurn);
        setCurrentQuestion(question);
        setOpponent(opponentUsername);

        socket.emit('join_room', { room: roomFromUrl, username });

        socket.on('timer_update', ({ timers }: TimerUpdateData) => {
          if (username !== null) {
            const myTime = timers[username];
            const opponentTime = timers[opponentUsername];
            setTimers({ myTime: myTime, opponentTime: opponentTime });
          }
        });

        socket.on('next_turn', ({ question, isPlayerTurn }: NextTurnData) => {
          setIsPlayerTurn(isPlayerTurn);
          setCurrentQuestion(question);
        });

        socket.on('game_over', ({ winner, loser }: GameOverData) => {
          setGameOverMessage(`${winner} wins! ${loser} loses.`);
          setIsGameOver(true);
          setCountdown(5); // Initialize countdown
        });

        // **New: Handle User Leaving**
        socket.on('user_left', () => {
          setGameOverMessage('Other user left the game. You win!');
          setIsGameOver(true);
          setCountdown(5);
        });

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
    } else {
      setLoading(false);
      handleSocketConnect(socket);
    }

    if (!loading) {
      return () => {
        socket.off('timer_update');
        socket.off('next_turn');
        socket.off('game_over');
        socket.off('user_left'); // **Ensure to remove the new event listener**
        socket.off('skip_turn');
      };
    }
  }, [socket, navigate, username]);

  if (loading) {
    return <div>Loading...</div>; // Show a loading state while the socket is connecting
  }

  const handleAnswer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isPlayerTurn === username && answer.trim().toLowerCase() === currentQuestion?.capital.toLowerCase()) {
      setAnswer('');
      socket?.emit('next_turn', { room });
    }
  };

  const handleSkip = () => {
    if (isPlayerTurn === username) {
      socket?.emit('skip_turn', { room });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center relative">
      
      {/* Game Over Notification */}
      {isGameOver && (
        <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-center py-4">
          <p className="text-xl font-semibold">{gameOverMessage}</p>
          <p className="mt-2">Returning to dashboard in {countdown}...</p>
        </div>
      )}

      {/* Leave Game Button */}
      {!isGameOver && (
        <button
          onClick={() => {
            socket?.emit('leave_game', { room, username });
            navigate('/dashboard');
          }}
          className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-md"
        >
          Leave Game
        </button>
      )}
      
      {/* Game Container */}
      <div className="bg-white p-16 rounded-lg shadow-md w-full max-w-md">
        {/* Timer Section */}
        <div className="flex justify-between mb-6">
          <p className="text-gray-700 font-semibold">Your Time: {timers.myTime}s</p>
          <p className="text-gray-700 font-semibold">{opponent}'s Time: {timers.opponentTime}s</p>
        </div>

        {/* Game Body */}
        <div
          className={`${
            isPlayerTurn !== username ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <h2 className="text-2xl font-bold text-center mb-4">
            {currentQuestion?.country}
          </h2>
          <form className="flex flex-col items-center" onSubmit={handleAnswer}>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isPlayerTurn !== username}
              className="w-full p-3 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isPlayerTurn !== username}
                className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                  isPlayerTurn !== username ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Enter
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={isPlayerTurn !== username}
                className={`px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 ${
                  isPlayerTurn !== username ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Skip
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Game;
