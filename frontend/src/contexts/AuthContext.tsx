'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface GoogleAuthResult { needsRole: boolean; }

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<GoogleAuthResult>;
  completeProfile: (role: 'mentor' | 'mentore' | 'admin') => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) {
        localStorage.removeItem('token'); localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, mot_de_passe: password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        toast.success('Connexion réussie');
      } else {
        throw new Error(response.data.message || 'Erreur de connexion');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur de connexion');
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const response = await api.post('/auth/register', {
        nom: data.nom, prenom: data.prenom, email: data.email,
        mot_de_passe: data.mot_de_passe, role: data.role
      });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        toast.success('Inscription réussie');
      } else {
        throw new Error(response.data.message || "Erreur d'inscription");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur d'inscription");
      throw error;
    }
  };

  const loginWithGoogle = async (credential: string): Promise<GoogleAuthResult> => {
    try {
      const response = await api.post('/auth/google', { credential });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        toast.success(response.data.message || 'Connexion réussie');
        return { needsRole: !!response.data.needsRole };
      } else {
        throw new Error(response.data.message || 'Erreur Google');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur Google');
      throw error;
    }
  };

  const completeProfile = async (role: 'mentor' | 'mentore' | 'admin') => {
    try {
      const response = await api.put('/auth/complete-profile', { role });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser((prevUser) => {
          if (!prevUser) return prevUser;
          const updatedUser = { ...prevUser, role };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          return updatedUser;
        });
        toast.success('Profil complété avec succès');
      } else {
        throw new Error(response.data.message || 'Erreur');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
    toast.success('Déconnexion réussie');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, completeProfile, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};