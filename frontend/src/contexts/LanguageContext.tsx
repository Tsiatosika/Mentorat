'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.dashboard': 'Tableau de bord',
    'nav.mentors': 'Mentors',
    'nav.sessions': 'Sessions',
    'nav.chat': 'Chat',
    'nav.reports': 'Rapports',
    'tools.matching': 'Matching IA',
    'tools.profile': 'Mon profil',
    
    // Home page
    'home.badge': 'Plateforme de mentorat nouvelle génération',
    'home.hero_title': 'Trouvez le mentor qui',
    'home.hero_subtitle': 'vous révélera',
    'home.hero_description': 'Rejoignez notre communauté et accélérez votre apprentissage grâce à un mentorat personnalisé avec matching IA',
    'home.start_free': 'Commencer gratuitement',
    'home.view_mentors': 'Voir les mentors',
    'home.stats_mentors': 'Mentors experts',
    'home.stats_sessions': 'Sessions réalisées',
    'home.stats_satisfaction': 'Taux de satisfaction',
    'home.stats_support': 'Support disponible',
    'home.why_choose_us': 'Pourquoi choisir notre plateforme ?',
    'home.why_choose_us_desc': 'Une expérience de mentorat complète et innovante',
    'home.feature_matching': 'Matching IA',
    'home.feature_matching_desc': 'Trouvez le mentor parfait grâce à notre algorithme intelligent',
    'home.feature_booking': 'Réservation facile',
    'home.feature_booking_desc': 'Planifiez vos sessions en quelques clics',
    'home.feature_chat': 'Chat en temps réel',
    'home.feature_chat_desc': 'Communications instantanées avec votre mentor',
    'home.feature_video': 'Visioconférence',
    'home.feature_video_desc': 'Sessions en ligne avec lien intégré',
    'home.feature_certification': 'Certification',
    'home.feature_certification_desc': 'Obtenez des certificats de progression',
    'home.feature_security': 'Sécurisé',
    'home.feature_security_desc': 'Plateforme sécurisée et confidentielle',
    'home.cta_title': 'Prêt à commencer votre parcours ?',
    'home.cta_description': 'Rejoignez des milliers d\'étudiants qui ont déjà trouvé leur mentor idéal',
    'home.cta_button': 'Inscription gratuite',
    'footer.title': 'Plateforme de Mentorat Académique',
    'footer.project': 'Projet de Fin d\'Études',
    
    // Dashboard
    'dashboard.welcome': 'Bienvenue',
    'dashboard.activity': 'Votre activité',
    'dashboard.quick_access': 'Accès rapide',
    'dashboard.sessions': 'Mes sessions',
    'dashboard.messages': 'Messagerie',
    'dashboard.reports': 'Rapports',
    'dashboard.find_mentor': 'Trouver un mentor',
    'dashboard.recommendations': 'Recommandations IA',
    'dashboard.sessions_desc': 'Voir et gérer vos sessions',
    'dashboard.messages_desc': 'Discuter avec vos contacts',
    'dashboard.reports_desc': 'Télécharger vos rapports',
    'dashboard.find_mentor_desc': 'Rechercher des mentors',
    'dashboard.recommendations_desc': 'Mentors suggérés pour vous',
    
    // Profile
    'profile.title': 'Mon profil',
    'profile.edit': 'Modifier',
    'profile.save': 'Enregistrer',
    'profile.photo': 'Photo de profil',
    'profile.info': 'Informations personnelles',
    'profile.experience': 'Expérience',
    'profile.progression': 'Progression',
    'profile.disponibilites': 'Mes disponibilités',
    'profile.disponibilites_desc': 'Gérer vos créneaux',
    
    // Sessions
    'sessions.title': 'Mes sessions',
    'sessions.all': 'Toutes',
    'sessions.pending': 'En attente',
    'sessions.confirmed': 'Confirmées',
    'sessions.in_progress': 'En cours',
    'sessions.completed': 'Terminées',
    'sessions.cancelled': 'Annulées',
    'sessions.confirm': 'Confirmer',
    'sessions.cancel': 'Annuler',
    'sessions.start': 'Démarrer',
    'sessions.chat': 'Chat',
    'sessions.with': 'Avec',
    'sessions.started': 'Session démarrée',
    'sessions.cancel_confirm': 'Annuler cette session ?',
    'sessions.no_sessions': 'Aucune session trouvée',
    
    // Chat
    'chat.title': 'Messagerie',
    'chat.subtitle': 'Discutez avec vos mentors et mentorés',
    'chat.no_conversation': 'Aucune conversation',
    'chat.no_conversation_desc': 'Vous n\'avez pas encore de sessions actives.',
    'chat.start': 'Commencez la conversation !',
    
    // Reports
    'reports.title': 'Rapports',
    'reports.subtitle': 'Générez et téléchargez vos rapports',
    'reports.no_sessions': 'Aucune session terminée',
    'reports.no_sessions_desc': 'Les rapports seront disponibles une fois vos sessions terminées.',
    'reports.generate': 'Générer',
    'reports.download': 'Télécharger',
    'reports.generating': 'Génération du rapport...',
    'reports.downloaded': 'Rapport téléchargé !',
    
    // Matching
    'matching.title': 'Recommandations IA',
    'matching.subtitle': 'Mentors sélectionnés pour vous',
    'matching.no_results': 'Aucune recommandation',
    'matching.view_profile': 'Voir le profil',
    'matching.book': 'Réserver',
    
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.back': 'Retour',
    'common.new': 'Nouveau',
    'common.logout': 'Déconnexion',
    'common.saving': 'Enregistrement...',

    //Mentors
    'mentors.subtitle': 'Des experts passionnés prêts à vous accompagner',
    'mentors.search_placeholder': 'Rechercher un mentor...',
    'mentors.domaine_placeholder': 'Domaine (ex: Informatique)',
    'mentors.all': 'Tous',
    'mentors.available': 'Disponibles',
    'mentors.reset': 'Réinitialiser',
    'mentors.no_results': 'Aucun mentor trouvé',
    'mentors.expert': 'Expert',
    'mentors.years': 'ans exp.',
    'mentors.sessions': 'sessions',
    'mentors.view_profile': 'Voir le profil',

    //Matching
    'matching.mentor_only': 'Le matching IA est réservé aux mentorés',
    'matching.updated': 'Recommandations mises à jour',
    'matching.excellent': 'Excellent match !',
    'matching.very_good': 'Très bon match',
    'matching.good': 'Bon match',
    'matching.potential': 'Match potentiel',
    'matching.python_ia': 'IA Python (TensorFlow)',
    'matching.algorithm': 'Algorithme intelligent',
    'matching.refresh': 'Actualiser',
    'matching.no_results_desc': 'Complétez votre profil et vos objectifs pour recevoir des recommandations personnalisées.',
    'matching.mentors_found': 'mentor(s) trouvé(s) - classés par pertinence',
    'matching.compatibility_score': 'Score de compatibilité',
    'matching.competences': 'Compétences',
    'matching.domain': 'Domaine',
    'matching.reputation': 'Réputation',
    'matching.experience': 'Expérience',

  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.mentors': 'Mentors',
    'nav.sessions': 'Sessions',
    'nav.chat': 'Chat',
    'nav.reports': 'Reports',
    'tools.matching': 'AI Matching',
    'tools.profile': 'My profile',
    
    // Home page
    'home.badge': 'Next generation mentoring platform',
    'home.hero_title': 'Find the mentor who',
    'home.hero_subtitle': 'will reveal you',
    'home.hero_description': 'Join our community and accelerate your learning with personalized mentoring and AI matching',
    'home.start_free': 'Start for free',
    'home.view_mentors': 'View mentors',
    'home.stats_mentors': 'Expert mentors',
    'home.stats_sessions': 'Sessions completed',
    'home.stats_satisfaction': 'Satisfaction rate',
    'home.stats_support': '24/7 Support',
    'home.why_choose_us': 'Why choose our platform?',
    'home.why_choose_us_desc': 'A complete and innovative mentoring experience',
    'home.feature_matching': 'AI Matching',
    'home.feature_matching_desc': 'Find the perfect mentor with our intelligent algorithm',
    'home.feature_booking': 'Easy booking',
    'home.feature_booking_desc': 'Schedule your sessions in few clicks',
    'home.feature_chat': 'Real-time chat',
    'home.feature_chat_desc': 'Instant communication with your mentor',
    'home.feature_video': 'Video conferencing',
    'home.feature_video_desc': 'Online sessions with integrated link',
    'home.feature_certification': 'Certification',
    'home.feature_certification_desc': 'Get progress certificates',
    'home.feature_security': 'Secure',
    'home.feature_security_desc': 'Secure and confidential platform',
    'home.cta_title': 'Ready to start your journey?',
    'home.cta_description': 'Join thousands of students who already found their ideal mentor',
    'home.cta_button': 'Free registration',
    'footer.title': 'Academic Mentoring Platform',
    'footer.project': 'Final Year Project',
    
    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.activity': 'Your activity',
    'dashboard.quick_access': 'Quick access',
    'dashboard.sessions': 'My sessions',
    'dashboard.messages': 'Messages',
    'dashboard.reports': 'Reports',
    'dashboard.find_mentor': 'Find a mentor',
    'dashboard.recommendations': 'AI Recommendations',
    'dashboard.sessions_desc': 'View and manage your sessions',
    'dashboard.messages_desc': 'Chat with your contacts',
    'dashboard.reports_desc': 'Download your reports',
    'dashboard.find_mentor_desc': 'Search for mentors',
    'dashboard.recommendations_desc': 'Suggested mentors for you',
    
    // Profile
    'profile.title': 'My profile',
    'profile.edit': 'Edit',
    'profile.save': 'Save',
    'profile.photo': 'Profile photo',
    'profile.info': 'Personal information',
    'profile.experience': 'Experience',
    'profile.progression': 'Progress',
    'profile.disponibilites': 'My availability',
    'profile.disponibilites_desc': 'Manage your schedule',
    
    // Sessions
    'sessions.title': 'My sessions',
    'sessions.all': 'All',
    'sessions.pending': 'Pending',
    'sessions.confirmed': 'Confirmed',
    'sessions.in_progress': 'In progress',
    'sessions.completed': 'Completed',
    'sessions.cancelled': 'Cancelled',
    'sessions.confirm': 'Confirm',
    'sessions.cancel': 'Cancel',
    'sessions.start': 'Start',
    'sessions.chat': 'Chat',
    'sessions.with': 'With',
    'sessions.started': 'Session started',
    'sessions.cancel_confirm': 'Cancel this session?',
    'sessions.no_sessions': 'No sessions found',
    
    // Chat
    'chat.title': 'Messages',
    'chat.subtitle': 'Chat with your mentors and mentees',
    'chat.no_conversation': 'No conversation',
    'chat.no_conversation_desc': 'You have no active sessions yet.',
    'chat.start': 'Start the conversation!',
    
    // Reports
    'reports.title': 'Reports',
    'reports.subtitle': 'Generate and download your reports',
    'reports.no_sessions': 'No completed sessions',
    'reports.no_sessions_desc': 'Reports will be available once your sessions are completed.',
    'reports.generate': 'Generate',
    'reports.download': 'Download',
    'reports.generating': 'Generating report...',
    'reports.downloaded': 'Report downloaded!',
    
    // Matching
    'matching.title': 'AI Recommendations',
    'matching.subtitle': 'Mentors selected for you',
    'matching.no_results': 'No recommendations',
    'matching.view_profile': 'View profile',
    'matching.book': 'Book',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.new': 'New',
    'common.logout': 'Logout',
    'common.saving': 'Saving...',

    //Mentors
    'mentors.subtitle': 'Passionate experts ready to guide you',
    'mentors.search_placeholder': 'Search for a mentor...',
    'mentors.domaine_placeholder': 'Field (ex: Computer Science)',
    'mentors.all': 'All',
    'mentors.available': 'Available',
    'mentors.reset': 'Reset',
    'mentors.no_results': 'No mentors found',
    'mentors.expert': 'Expert',
    'mentors.years': 'years exp.',
    'mentors.sessions': 'sessions',
    'mentors.view_profile': 'View profile',

    //Matching
    'matching.mentor_only': 'AI Matching is reserved for mentees',
    'matching.updated': 'Recommendations updated',
    'matching.excellent': 'Excellent match!',
    'matching.very_good': 'Very good match',
    'matching.good': 'Good match',
    'matching.potential': 'Potential match',
    'matching.python_ia': 'Python AI (TensorFlow)',
    'matching.algorithm': 'Intelligent algorithm',
    'matching.refresh': 'Refresh',
    'matching.no_results_desc': 'Complete your profile and goals to receive personalized recommendations.',
    'matching.mentors_found': 'mentor(s) found - ranked by relevance',
    'matching.compatibility_score': 'Compatibility score',
    'matching.competences': 'Skills',
    'matching.domain': 'Domain',
    'matching.reputation': 'Reputation',
    'matching.experience': 'Experience',

 },
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('fr');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language | null;
    if (saved === 'fr' || saved === 'en') {
      setLanguage(saved);
    }
    setMounted(true);
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  if (!mounted) return null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
