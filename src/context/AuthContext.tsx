import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
  quizType: 'custom' | 'default' | null;
  setQuizType: (type: 'custom' | 'default' | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  
  const [username, setUsername] = useState<string | null>(null);
  const [quizType, setQuizType] = useState<'custom' | 'default' | null>('default');

  const login = (username: string) => {
    setUsername(username);
    
  };

  const logout = () => {
    setUsername(null);
      
  };

  return (
    <AuthContext.Provider value={{ username, login, logout, quizType, setQuizType }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
