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
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Quiz App</h1>
      </div>
      <div className="navbar-user">
        <p>Logged in as: {username}</p>
      </div>
      <form className="navbar-search" onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          placeholder="Search for users"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
        />
        <button type="submit" onClick={() => handleInvite(searchQuery)}>Invite</button>
      </form>
      {showDropdown && searchResults.length > 0 && (
        <div className="search-results">
          <ul>
            {searchResults.map((user) => (
              <li key={user.id}>{user.username}</li>
            ))}
          </ul>
        </div>
      )}
      {invitations.length > 0 && (
        <div className="invitations">
          {invitations.map((inv, index) => (
            <div key={index} className="invitation-popup">
              <p>{inv.from} has invited you</p>
              <button onClick={() => handleAccept(inv.from)}>Accept</button>
              <button onClick={() => handleDecline(inv.from)}>Decline</button>
            </div>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
