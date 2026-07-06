import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isCheckingAuth: false,
  error: null,

  checkAuth: async () => {
    if (get().isCheckingAuth) return;
    set({ isLoading: true, isCheckingAuth: true });
    try {
      const response = await api.get('/auth/me');
      if (response.data.user) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          isCheckingAuth: false,
          error: null,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isCheckingAuth: false,
          error: null,
        });
      }
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isCheckingAuth: false,
        error: null,
      });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      toast.success(`Welcome back, ${response.data.user.name}!`);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ isLoading: false, error: msg });
      toast.error(msg);
      return { success: false, message: msg };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({ user: null, isAuthenticated: false });
      toast.success('Logged out successfully');
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await api.put('/auth/profile', data);
      set({ user: { ...get().user, ...response.data.user } });
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update profile';
      toast.error(msg);
      return { success: false, message: msg };
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', formData);
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      toast.success(`Account created! Welcome, ${response.data.user.name}!`);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      set({ isLoading: false, error: msg });
      toast.error(msg);
      return { success: false, message: msg };
    }
  },

  uploadProfilePhoto: async (file) => {
    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);
      const response = await api.post('/auth/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set({ user: { ...get().user, profilePhoto: response.data.url } });
      toast.success('Profile photo updated!');
      return { success: true, url: response.data.url };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to upload image';
      toast.error(msg);
      return { success: false, message: msg };
    }
  },
}));

// Listen for unauthorized events from interceptor
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
  });
}

export default useAuthStore;
