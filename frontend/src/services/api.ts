import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Mentor
export const mentorAPI = {
  getProfile: () => api.get('/mentors/profile'),
  updateProfile: (data: any) => api.put('/mentors/profile', data),
  addCompetence: (data: any) => api.post('/mentors/competences', data),
  removeCompetence: (competenceId: string) => api.delete(`/mentors/competences/${competenceId}`),
};

// Mentoré
export const mentoreAPI = {
  getProfile: () => api.get('/mentores/profile'),
  updateProfile: (data: any) => api.put('/mentores/profile', data),
  getProgression: () => api.get('/mentores/progression'),
};

// Disponibilités
export const disponibiliteAPI = {
  getAll: () => api.get('/disponibilites'),
  create: (data: any) => api.post('/disponibilites', data),
  update: (id: string, data: any) => api.put(`/disponibilites/${id}`, data),
  delete: (id: string) => api.delete(`/disponibilites/${id}`),
  getByMentor: (mentorId: string) => api.get(`/disponibilites/mentor/${mentorId}`),
};

// Compétences
export const competenceAPI = {
  getAll: () => api.get('/competences'),
  search: (q: string) => api.get(`/competences/search?q=${q}`),
  getById: (id: string) => api.get(`/competences/${id}`),
};

// Sessions
export const sessionAPI = {
  getAll: (params?: any) => api.get('/sessions', { params }),
  getById: (id: string) => api.get(`/sessions/${id}`),
  create: (data: any) => api.post('/sessions', data),
  confirm: (id: string) => api.put(`/sessions/${id}/confirm`),
  cancel: (id: string, raison?: string) => api.put(`/sessions/${id}/cancel`, { raison }),
  start: (id: string) => api.put(`/sessions/${id}/start`),
  complete: (id: string, data: any) => api.put(`/sessions/${id}/complete`, data),
  addVisio: (id: string, lien_visio: string) => api.put(`/sessions/${id}/visio`, { lien_visio }),
};

// Messages
export const messageAPI = {
  getBySession: (sessionId: string, page?: number) => 
    api.get(`/messages/session/${sessionId}`, { params: { page } }),
  markAsRead: (sessionId: string) => api.put(`/messages/session/${sessionId}/read`),
  getUnreadCount: () => api.get('/messages/unread/count'),
};

// Matching
export const matchingAPI = {
  getRecommendations: (forceRecalc?: boolean) => 
    api.get('/matching/recommendations', { params: { force_recalc: forceRecalc } }),
  getTopMentors: (limit?: number) => api.get('/matching/top-mentors', { params: { limit } }),
};

// Rapports
export const rapportAPI = {
  generateSession: (sessionId: string) => api.post(`/rapports/session/${sessionId}/generate`),
  downloadSession: (sessionId: string) => api.get(`/rapports/session/${sessionId}/download`),
  generateProgression: () => api.post('/rapports/progression/generate'),
};

// Recherche publique
export const publicAPI = {
  searchMentors: (params: any) => api.get('/mentors', { params }),
  getMentorById: (id: string) => api.get(`/mentors/${id}`),
};

export default api;