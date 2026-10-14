import { createContext, useContext, useEffect, useState } from 'react';
import { getToken, setToken as persistToken, clearSession, USER_KEY } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  function login(newToken, newUser) {
    persistToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
  }

  function updateUser(newUser) {
    setUser(newUser);
  }

  function signOut() {
    clearSession();
    setTokenState(null);
    setUser(null);
  }

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    login,
    updateUser,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
