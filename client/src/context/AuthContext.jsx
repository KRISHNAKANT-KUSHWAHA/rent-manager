import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginOwner as apiLogin,
  getMe,
  logoutOwner as apiLogout,
  setupOwner as apiSetup,
  getAuthStatus,
} from '../api/authApi';
import { invalidateCache } from '../hooks/useDataCache';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);

  const checkStatus = async () => {
    try {
      const statusRes = await getAuthStatus();
      if (statusRes.success) {
        setIsSetupRequired(!statusRes.isSetup);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkStatus();
        const storedUser = localStorage.getItem('owner_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        const data = await getMe();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('owner_user', JSON.stringify(data.user));
          setIsSetupRequired(false);
        }
      } catch (err) {
        localStorage.removeItem('owner_user');
        localStorage.removeItem('owner_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await apiLogin({ email, password });
    if (data.success) {
      setUser(data.user);
      localStorage.setItem('owner_user', JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem('owner_token', data.token);
      }
      setIsSetupRequired(false);
    }
    return data;
  };

  const setup = async (setupData) => {
    const data = await apiSetup(setupData);
    if (data.success) {
      setUser(data.user);
      localStorage.setItem('owner_user', JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem('owner_token', data.token);
      }
      setIsSetupRequired(false);
    }
    return data;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      // ignore network errors on logout
    } finally {
      localStorage.removeItem('owner_user');
      localStorage.removeItem('owner_token');
      try {
        invalidateCache();
      } catch (err) {
        // ignore
      }
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('owner_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isSetupRequired,
        loading,
        login,
        setup,
        logout,
        updateUser,
        checkStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
