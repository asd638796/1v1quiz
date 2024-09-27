import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
}

interface NavbarProps {
  gameDuration: number;
  skipPenalty: number;
}

interface Invitation {
  from: string;
  settings: {
    gameDuration: number;
    skipPenalty: number;
  };
}

const Navbar = ({gameDuration, skipPenalty}: NavbarProps): React.JSX.Element => {
  const { username } = useAuth();
  const { socket } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const navigate = useNavigate();

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length > 0) {
        try {
          const response = await axios.get(`/api/search-users?query=${query}`, { withCredentials: true });
          setSearchResults(response.data.slice(0, 5));
          setShowDropdown(true);
        } catch (error) {
          console.error('Error searching for users:', error);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300),
    []
  );

  const handleInvite = (invitee: string) => {
    if (socket && username) {
      const settings = {
        gameDuration, 
        skipPenalty
      }
      socket.emit('send_invitation', { from: username, to: invitee, settings });
    }
  };

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  useEffect(() => {
    if (socket) {
      socket.on('receive_invitation', (invitation:Invitation) => {
        setInvitations((prevInvitations) => [...prevInvitations, invitation]);
      });

      socket.on('start_game', ({ room }) => {
        navigate(`/game?room=${room}`);
      });

      return () => {
        socket.off('receive_invitation');
        socket.off('start_game');
      };
    }
  }, [socket, navigate]);

  const handleAccept = (from: string) => {
    if (socket && username) {
      const invitation = invitations.find((inv) => inv.from === from);
      
      if(invitation){
        socket.emit('accept_invitation', { from, to: username, settings: invitation.settings, });
      }
    }
    console.log(`User ${username} accepted invite from ${from}`);
    setInvitations(invitations.filter((inv) => inv.from !== from));
  };

  const handleDecline = (from: string) => {
    console.log(`User ${username} declined invite from ${from}`);
    setInvitations(invitations.filter((inv) => inv.from !== from));
  };

  return (
    <nav className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
      {/* Navbar Brand */}
      <div className="flex items-center">
        <h1 className="text-xl font-bold">Quiz App</h1>
      </div>

      {/* Navbar User Info */}
      <div className="hidden md:flex items-center">
        <p className="mr-6">Logged in as: {username}</p>
      </div>

      {/* Navbar Search and Invitations */}
      <div className="flex items-center space-x-4">
        {/* Search Form */}
        <form
          className="relative"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="text"
            placeholder="Search for users"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
            className="rounded-full px-4 py-2 text-black"
          />
          <button
            type="submit"
            onClick={() => {handleInvite(searchQuery); setShowDropdown(false);}}
            
            className="absolute right-0 top-0 mt-1 mr-1 px-3 py-1 bg-green-500 text-white rounded-full hover:bg-green-600"
          >
            Invite
          </button>

          {/* Search Results Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute mt-2 w-full bg-white rounded-md shadow-lg z-10 text-black">
              <ul className="py-2">
                {searchResults.map((user) => (
                  <li
                    key={user.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setSearchQuery(user.username);
                      setShowDropdown(false);
                    }}
                  >
                    {user.username}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>

        {/* Invitations */}
        <div className="relative">
          <div
            className={`text-sm rounded-full h-6 w-6 flex items-center justify-center ${
              invitations.length > 0 ? 'bg-red-500' : 'bg-transparent'
            }`}
          >
            {invitations.length > 0 ? invitations.length : ''}
          </div>

          {invitations.length > 0 && (
            <div className="absolute right-0 mt-6 w-64 bg-white rounded-md shadow-lg z-20">
              {invitations.map((inv, index) => (
                <div key={index} className="p-4 border-b last:border-b-0">
                  <p className="text-black mb-2">{inv.from} has invited you</p>
                  <button
                    onClick={() => handleAccept(inv.from)}
                    className="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(inv.from)}
                    className="px-3 py-1 bg-gray-300 text-black rounded hover:bg-gray-400"
                  >
                    Decline
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
