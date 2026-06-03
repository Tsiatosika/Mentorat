'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
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
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ── CORRECTION 1 : vérification du token au démarrage ─────────────────────
  // On ne fait pas confiance uniquement au localStorage — on valide le token
  // auprès du backend. Si le token est expiré, on déconnecte proprement.
  useEffect(() => {
    const token     = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      setLoading(false);
      return;
    }

    // Charger le user depuis le localStorage immédiatement (UX rapide)
    try {
      setUser(JSON.parse(savedUser));
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setLoading(false);
      return;
    }

    // Vérifier la validité du token côté serveur en arrière-plan
    api.get('/auth/me')
      .then((res) => {
        // Mettre à jour avec les données fraîches du serveur
        const freshUser = res.data.user;
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      })
      .catch(() => {
        // Token invalide ou expiré → déconnexion silencieuse
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        mot_de_passe: password,
      });

      if (response.data.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        toast.success('Connexion réussie');

        // CORRECTION 2 : redirection selon le rôle après connexion
        if (userData.role === 'mentor') {
          router.push('/dashboard');
        } else {
          router.push('/matching');
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Email ou mot de passe incorrect';
      toast.error(msg);
      throw error;
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const register = async (data: any) => {
    try {
      const response = await api.post('/auth/register', {
        nom:          data.nom,
        prenom:       data.prenom,
        email:        data.email,
        mot_de_passe: data.mot_de_passe,
        role:         data.role,
      });

      if (response.data.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        toast.success('Inscription réussie ! Bienvenue 🎉');

        // Redirection selon le rôle
        if (userData.role === 'mentor') {
          router.push('/profile');   // le mentor complète son profil d'abord
        } else {
          router.push('/matching');  // le mentoré voit les recommandations
        }
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erreur lors de l\'inscription';
      toast.error(msg);
      throw error;
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  // CORRECTION 3 : appel API logout avant de nettoyer le localStorage
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // On continue même si l'appel échoue (token déjà invalide)
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      toast.success('Déconnexion réussie');
      router.push('/');
    }
  }, [router]);

  // ── updateUser ─────────────────────────────────────────────────────────────
  // CORRECTION 4 : merge avec le user existant au lieu de remplacer entièrement
  // Evite de perdre des champs si on ne met à jour qu'une partie du profil
  const updateUser = useCallback((updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {/* CORRECTION 5 : ne pas rendre les enfants pendant le chargement initial
          pour éviter les flashs de contenu non authentifié */}
      {!loading && children}
    </AuthContext.Provider>
  );
};