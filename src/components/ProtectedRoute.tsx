import React, { useEffect, useState } from 'react';
import { Navigate, RouteProps } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
}

const ProtectedRoute = ({ component: Component, ...rest }: ProtectedRouteProps): React.JSX.Element => {
  const { username, login, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/get-user', { withCredentials: true });
        if (response.data.username) {
          login(response.data.username); // Update the context state
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        logout(); // Ensure the user is logged out in case of error
        setIsAuthenticated(false);
      } finally {
        setLoading(false); // End the loading state
      }
    };

    if (!username) {
      checkAuth();
    } else {
      setIsAuthenticated(true); // Already authenticated
      setLoading(false);
    }
  }, [username, login, logout]);

  if (loading) {
    return <div>Loading...</div>; // Display a loading indicator while checking auth
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />; // Redirect to login page if not authenticated
  }

  return <Component {...rest} />;
};

export default ProtectedRoute;
