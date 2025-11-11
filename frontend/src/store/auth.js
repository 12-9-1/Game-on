import { create } from 'zustand';

const API_URL = 'http://localhost:5000';

const persisted = (() => {
  try { return JSON.parse(localStorage.getItem('auth')) || null; } catch { return null; }
})();

export const useAuth = create((set, get) => ({
  user: persisted?.user || null,
  token: persisted?.token || null,
  loading: false,
  error: null,

  setAuth: ({ user, token }) => {
    const next = { user, token };
    localStorage.setItem('auth', JSON.stringify(next));
    set({ user, token, error: null });
  },
  clearAuth: () => { localStorage.removeItem('auth'); set({ user: null, token: null, error: null }); },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Error de inicio de sesión');
      get().setAuth({ user: data.user, token: data.token });
      set({ loading: false });
      return data;
    } catch (e) { set({ loading: false, error: e.message || 'Error' }); throw e; }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Error de registro');
      get().setAuth({ user: data.user, token: data.token });
      set({ loading: false });
      return data;
    } catch (e) { set({ loading: false, error: e.message || 'Error' }); throw e; }
  },

  fetchMe: async () => {
    const token = get().token; if (!token) return null;
    const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null; return res.json();
  }
}));
