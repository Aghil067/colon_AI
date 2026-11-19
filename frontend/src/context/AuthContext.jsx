import { useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from './useAuth';

function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common.Authorization;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const controller = new AbortController();
    async function restoreSession() {
      try {
        if (token) {
          setToken(token);
          const { data } = await axios.get('/api/me', { signal: controller.signal, timeout: 5000 });
          if (!controller.signal.aborted) setUser(data);
        }
      } catch (error) {
        if (!controller.signal.aborted && error.response?.status === 401) setToken(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    restoreSession();
    return () => controller.abort();
  }, []);

  async function login(email, password) {
    try {
      const { data } = await axios.post('/api/login', { email, password });
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed.' };
    }
  }

  async function register(name, email, password, role) {
    try {
      await axios.post('/api/register', { name, email, password, role });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed.' };
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {loading ? <p className="p-6" role="status">Checking session…</p> : children}
    </AuthContext.Provider>
  );
}
