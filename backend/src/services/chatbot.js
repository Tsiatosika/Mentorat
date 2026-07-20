const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const mentoripathContext = `
Tu es l'assistant virtuel de MentorIPath, une plateforme de mentorat académique avec matching IA.

Contexte du projet :
- Plateforme créée par des étudiants de l'Université Adventiste Zurcher (UAZ)
- Mention Informatique, année 2025-2026
- Projet de fin d'études

Fonctionnalités de la plateforme :
1. Inscription/Connexion (email + Google OAuth)
2. Profils mentors (compétences, domaine, disponibilités, CV)
3. Profils mentorés (objectifs, niveau d'étude)
4. Matching IA automatique mentors ↔ mentorés
5. Sessions de mentorat (planification, visio, chat)
6. Génération de rapports PDF
7. Tableau de bord administrateur
8. Mode sombre/clair
9. Internationalisation FR/EN

Technologies utilisées :
- Frontend : Next.js 14, React, TypeScript
- Backend : Express.js, Node.js
- Base de données : PostgreSQL
- IA Matching : Python, scikit-learn
- Temps réel : Socket.IO
- Conteneurisation : Docker
- Authentification : JWT + Google OAuth

Algorithme de matching :
Score = 0.40 × Compétences + 0.25 × Disponibilités + 0.20 × Objectifs + 0.15 × Réputation

Réponds de manière concise, utile et en français. Si on te pose une question hors sujet, ramène gentiment vers MentorIPath.

`; 

const chatHistory = new Map();

async function chatWithAI(userId, message) {
  try {
    if (!chatHistory.has(userId)) {
      chatHistory.set(userId, []);
    }
    const history = chatHistory.get(userId);

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash', // gemini-1.5-flash-8b est aussi deprecated, voir plus bas
      history: [
        { role: 'user', parts: [{ text: 'Contexte du projet MentorIPath' }] },
        { role: 'model', parts: [{ text: mentoripathContext }] },
        ...history.slice(-10),
      ],
    });

    const result = await chat.sendMessage({ message });
    const response = result.text;

    history.push(
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text: response }] }
    );

    return response;
  } catch (error) {
    console.error('Erreur chatbot:', error);
    return "Désolé, je rencontre des difficultés techniques. Veuillez réessayer.";
  }
}

module.exports = { chatWithAI };