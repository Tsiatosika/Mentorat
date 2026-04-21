export type UserRole = 'mentor' | 'mentore';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  photo_url?: string;
  actif: boolean;
  email_verifie: boolean;
  created_at: string;
  derniere_connexion?: string;
}

export interface MentorProfile {
  id: string;
  utilisateur_id: string;
  bio?: string;
  cv_url?: string;
  portfolio_url?: string;
  domaine?: string;
  annees_experience: number;
  note_moyenne: number;
  nb_sessions: number;
  disponible: boolean;
  competences?: Competence[];
  disponibilites?: Disponibilite[];
}

export interface MentoreProfile {
  id: string;
  utilisateur_id: string;
  niveau_etude?: string;
  domaine?: string;
  objectifs?: string;
  objectifs_tags?: string[];
  progression: number;
}

export interface Competence {
  id: string;
  nom: string;
  categorie?: string;
  niveau?: 'debutant' | 'intermediaire' | 'avance' | 'expert';
}

export interface Disponibilite {
  id: string;
  jour_semaine: 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';
  heure_debut: string;
  heure_fin: string;
  recurrent: boolean;
}

export interface Session {
  id: string;
  mentor_id: string;
  mentore_id: string;
  date_debut: string;
  date_fin: string;
  sujet: string;
  description?: string;
  statut: 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';
  lien_visio?: string;
  notes_mentor?: string;
  notes_mentore?: string;
  note_du_mentor?: number;
  note_du_mentore?: number;
  duree_reelle?: number;
  mentor_nom?: string;
  mentor_prenom?: string;
  mentore_nom?: string;
  mentore_prenom?: string;
}

export interface Message {
  id: string;
  session_id: string;
  expediteur_id: string;
  contenu: string;
  type_message: string;
  fichier_url?: string;
  envoye_le: string;
  lu: boolean;
  nom?: string;
  prenom?: string;
}

export interface Notification {
  id: string;
  type: string;
  titre: string;
  message: string;
  lien?: string;
  lue: boolean;
  created_at: string;
}

export interface MatchingScore {
  mentor_id: string;
  mentor_nom: string;
  score: number;
  score_competences: number;
  score_dispo: number;
  score_objectifs: number;
  score_reputation: number;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: User;
}