  import React, { useState } from 'react';
  import { useNavigate } from 'react-router-dom';
  import axios, {AxiosError, isAxiosError} from 'axios';
  import { useAuth } from '../context/AuthContext';
  import { useSocket } from '../context/SocketContext';

  const Login = (): React.JSX.Element => {
    const [username, setUsername] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();
    const { connect } = useSocket();
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async () => {
      try {
        await axios.post('/api/login', { username }, { withCredentials: true });
        login(username);
        connect();
        navigate('/dashboard');
      } catch (error: unknown) {
        
        if(axios.isAxiosError(error)){
          if (error.response && error.response.data && error.response.data.error) {
            setErrorMessage(error.response.data.error);
    
            // Clear the error message after 7 seconds
            setTimeout(() => {
              setErrorMessage('');
            }, 7000);
          } else {
            setErrorMessage('An error occurred. Please try again.');
    
            // Clear the error message after 7 seconds
            setTimeout(() => {
              setErrorMessage('');
            }, 7000);
          }
        }
      }
    };
    

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800">
        <div className="flex bg-white p-12 rounded-lg shadow-md w-full max-w-2xl items-stretch mb-8">

          <input
            className="flex-grow p-4 border-2 border-gray-300 border-r-0 rounded-l-md focus:outline-none focus:ring-0 focus:ring-blue-500"
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            onClick={handleLogin}
            className="p-4  bg-blue-500 text-white text-xl rounded-r-md hover:bg-blue-600 flex-shrink-0 w-32 "
          >
            Login
          </button>
        </div>
        <div
          className={`text-red-500 text-center h-6 ${errorMessage ? 'animate-fadeInOut' : ''}`}
        >
          {errorMessage}
        </div>
      </div>
    );
    
  };

  export default Login;
