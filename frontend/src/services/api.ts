import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Intercepteur requête : ajout du token JWT ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Intercepteur réponse : gestion 401 ───────────────────────────────────────
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

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: any)                  => api.post('/auth/register', data),
  login:    (data: any)                  => api.post('/auth/login', data),
  getMe:    ()                           => api.get('/auth/me'),
  logout:   ()                           => api.post('/auth/logout'),
  refresh:  ()                           => api.post('/auth/refresh'),
};

// ── Mentor ────────────────────────────────────────────────────────────────────
export const mentorAPI = {
  getProfile:       ()                           => api.get('/mentors/profile/me'),
  updateProfile:    (data: any)                  => api.put('/mentors/profile/me', data),
  addCompetence:    (data: any)                  => api.post('/mentors/competences', data),
  removeCompetence: (competenceId: string)       => api.delete(`/mentors/competences/${competenceId}`),
};

// ── Mentoré ───────────────────────────────────────────────────────────────────
export const mentoreAPI = {
  getProfile:    ()           => api.get('/mentores/profile/me'),
  updateProfile: (data: any)  => api.put('/mentores/profile/me', data),
  getProgression: ()          => api.get('/mentores/progression'),
};

// ── Disponibilités ────────────────────────────────────────────────────────────
export const disponibiliteAPI = {
  getAll:      ()                          => api.get('/disponibilites'),
  create:      (data: any)                 => api.post('/disponibilites', data),
  update:      (id: string, data: any)     => api.put(`/disponibilites/${id}`, data),
  delete:      (id: string)                => api.delete(`/disponibilites/${id}`),
  getByMentor: (mentorId: string)          => api.get(`/disponibilites/mentor/${mentorId}`),
};

// ── Compétences ───────────────────────────────────────────────────────────────
export const competenceAPI = {
  getAll:  ()             => api.get('/competences'),
  search:  (q: string)    => api.get(`/competences/search?q=${q}`),
  getById: (id: string)   => api.get(`/competences/${id}`),
};

// ── Sessions ──────────────────────────────────────────────────────────────────
// CORRECTION : routes en français pour correspondre au backend
export const sessionAPI = {
  getAll:    (params?: any)              => api.get('/sessions', { params }),
  getById:   (id: string)                => api.get(`/sessions/${id}`),
  create:    (data: any)                 => api.post('/sessions', data),
  confirm:   (id: string)                => api.put(`/sessions/${id}/confirmer`),
  cancel:    (id: string, raison?: string) => api.put(`/sessions/${id}/annuler`, { raison }),
  start:     (id: string)                => api.put(`/sessions/${id}/demarrer`),
  complete:  (id: string, data: any)     => api.put(`/sessions/${id}/terminer`, data),
  addVisio:  (id: string, lien: string)  => api.put(`/sessions/${id}/visio`, { lien_visio: lien }),
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const messageAPI = {
  getBySession:  (sessionId: string, page?: number) =>
    api.get(`/messages/session/${sessionId}`, { params: { page } }),
  markAsRead:    (sessionId: string) =>
    api.put(`/messages/session/${sessionId}/read`),
  getUnreadCount: () => api.get('/messages/unread/count'),
};

// ── Matching IA ───────────────────────────────────────────────────────────────
// CORRECTION : POST (pas GET) car le backend attend un body JSON
export const matchingAPI = {
  getRecommendations: (forceRecalc = false) =>
    api.post('/matching/recommendations', { force_recalc: forceRecalc }),
  getTopMentors: (limit = 6) =>
    api.get('/matching/top-mentors', { params: { limit } }),
  recalculateAll: (mentoreIds?: string[]) =>
    api.post('/matching/recalculate-all', { mentore_ids: mentoreIds || null }),
};

// ── Rapports ──────────────────────────────────────────────────────────────────
// CORRECTION : downloadSession utilise responseType blob pour les PDF
export const rapportAPI = {
  generateSession:    (sessionId: string) =>
    api.post(`/rapports/session/${sessionId}/generate`),
  downloadSession:    (sessionId: string) =>
    api.get(`/rapports/session/${sessionId}/download`, { responseType: 'blob' }),
  generateProgression: () =>
    api.post('/rapports/progression/generate'),
  getBySession:       (sessionId: string) =>
    api.get(`/rapports/session/${sessionId}`),
};

// ── Recherche publique (sans auth) ────────────────────────────────────────────
export const publicAPI = {
  searchMentors: (params: any)  => api.get('/mentors', { params }),
  getMentorById: (id: string)   => api.get(`/mentors/${id}`),
};

// ── Upload ────────────────────────────────────────────────────────────────────
export const uploadAPI = {
  photo: (file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post('/upload/photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  cv: (file: File) => {
    const form = new FormData();
    form.append('cv', file);
    return api.post('/upload/cv', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export default api;