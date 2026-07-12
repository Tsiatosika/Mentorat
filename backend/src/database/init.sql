-- backend/database/init.sql
-- Ce script s'exécute automatiquement au premier démarrage de PostgreSQL dans Docker

-- Créer l'extension UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════
-- 1. UTILISATEURS
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS utilisateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255),
  role VARCHAR(20) CHECK (role IN ('mentor', 'mentore')),
  google_id VARCHAR(255) UNIQUE,
  actif BOOLEAN DEFAULT true,
  email_verifie BOOLEAN DEFAULT false,
  photo_url VARCHAR(500),
  token_verification VARCHAR(255),
  token_reset VARCHAR(255),
  token_expire_le TIMESTAMP,
  derniere_connexion TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- 2. PROFILS MENTOR
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profils_mentor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id UUID UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
  bio TEXT,
  domaine VARCHAR(200),
  annees_experience INTEGER DEFAULT 0,
  note_moyenne DECIMAL(3,2) DEFAULT 0,
  nb_sessions INTEGER DEFAULT 0,
  disponible BOOLEAN DEFAULT true,
  cv_url VARCHAR(500),
  portfolio_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- 3. PROFILS MENTORÉ
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profils_mentore (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id UUID UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
  niveau_etude VARCHAR(100),
  domaine VARCHAR(200),
  objectifs TEXT,
  objectifs_tags TEXT[],
  progression INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- 4. COMPÉTENCES
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS competences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO competences (nom) VALUES 
  ('JavaScript'), ('TypeScript'), ('Python'), ('Java'), ('C++'),
  ('C#'), ('React'), ('Angular'), ('Vue.js'), ('Node.js'),
  ('Express.js'), ('Django'), ('Flask'), ('Spring Boot'),
  ('SQL'), ('PostgreSQL'), ('MongoDB'), ('Docker'), ('Kubernetes'),
  ('Git'), ('Machine Learning'), ('Data Science'), ('HTML/CSS'),
  ('PHP'), ('Ruby'), ('Swift'), ('Kotlin'), ('Flutter'),
  ('React Native'), ('DevOps'), ('AWS'), ('Azure'), ('SEO'),
  ('Photoshop'), ('Illustrator'), ('Figma'), ('Excel'),
  ('WordPress'), ('Shopify')
ON CONFLICT (nom) DO NOTHING;

-- ═══════════════════════════════════════════════════
-- 5. MENTOR-COMPÉTENCES (liaison)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mentor_competences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES profils_mentor(id) ON DELETE CASCADE,
  competence_id UUID NOT NULL REFERENCES competences(id) ON DELETE CASCADE,
  niveau VARCHAR(20) DEFAULT 'intermediaire',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(mentor_id, competence_id)
);

-- ═══════════════════════════════════════════════════
-- 6. DOMAINES
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS domaines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO domaines (nom, description, icon) VALUES
  ('Informatique', 'Developpement logiciel, programmation, IA', 'Code'),
  ('Marketing', 'Marketing digital, SEO, publicite', 'TrendingUp'),
  ('Design', 'Design graphique, UI/UX, illustration', 'Palette'),
  ('Finance', 'Comptabilite, investissement', 'DollarSign'),
  ('Management', 'Gestion de projet, leadership, RH', 'Users'),
  ('Data Science', 'Big Data, Machine Learning, statistiques', 'BarChart')
ON CONFLICT (nom) DO NOTHING;

-- ═══════════════════════════════════════════════════
-- 7. SESSIONS
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES profils_mentor(id),
  mentore_id UUID REFERENCES profils_mentore(id),
  sujet VARCHAR(255) NOT NULL,
  description TEXT,
  date_debut TIMESTAMP NOT NULL,
  date_fin TIMESTAMP,
  statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirmee', 'en_cours', 'terminee', 'annulee')),
  lien_visio VARCHAR(500),
  notes_mentor TEXT,
  notes_mentore TEXT,
  note_du_mentor INTEGER CHECK (note_du_mentor >= 1 AND note_du_mentor <= 5),
  note_du_mentore INTEGER CHECK (note_du_mentore >= 1 AND note_du_mentore <= 5),
  duree_reelle INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- 8. MESSAGES
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  expediteur_id UUID REFERENCES utilisateurs(id),
  contenu TEXT NOT NULL,
  fichier_url VARCHAR(500),
  lu BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- 9. AVIS
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS avis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES utilisateurs(id) ON DELETE CASCADE,
  mentore_id UUID REFERENCES utilisateurs(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id),
  note_globale INTEGER CHECK (note_globale >= 1 AND note_globale <= 5),
  note_ponctualite INTEGER CHECK (note_ponctualite >= 1 AND note_ponctualite <= 5),
  note_pedagogie INTEGER CHECK (note_pedagogie >= 1 AND note_pedagogie <= 5),
  note_disponibilite INTEGER CHECK (note_disponibilite >= 1 AND note_disponibilite <= 5),
  commentaire TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- 10. NOTIFICATIONS
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id UUID REFERENCES utilisateurs(id) ON DELETE CASCADE,
  titre VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50),
  lu BOOLEAN DEFAULT false,
  lien VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- 11. DISPONIBILITÉS
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS disponibilites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES profils_mentor(id) ON DELETE CASCADE,
  jour_semaine VARCHAR(20) NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  recurrent BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- 12. RAPPORTS
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS rapports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID UNIQUE REFERENCES sessions(id),
  contenu JSONB,
  fichier_url VARCHAR(500),
  genere_le TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- 13. MATCHING SCORES
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS matching_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentore_id UUID REFERENCES profils_mentore(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES profils_mentor(id) ON DELETE CASCADE,
  score DECIMAL(5,4) DEFAULT 0,
  score_competences DECIMAL(5,4) DEFAULT 0,
  score_domaine DECIMAL(5,4) DEFAULT 0,
  score_reputation DECIMAL(5,4) DEFAULT 0,
  score_experience DECIMAL(5,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(mentore_id, mentor_id)
);

-- ═══════════════════════════════════════════════════
-- INDEX POUR LES PERFORMANCES
-- ═══════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(role);
CREATE INDEX IF NOT EXISTS idx_mc_mentor ON mentor_competences(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mc_competence ON mentor_competences(competence_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mentor ON sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mentore ON sessions(mentore_id);
CREATE INDEX IF NOT EXISTS idx_sessions_statut ON sessions(statut);
CREATE INDEX IF NOT EXISTS idx_avis_mentor ON avis(mentor_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(utilisateur_id, lu);
CREATE INDEX IF NOT EXISTS idx_matching_mentore ON matching_scores(mentore_id);
CREATE INDEX IF NOT EXISTS idx_matching_mentor ON matching_scores(mentor_id);