const { query } = require('../config/db');

// Similarité cosinus entre deux vecteurs
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA.length || !vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * (vecB[i] || 0);
    normA += vecA[i] * vecA[i];
    normB += (vecB[i] || 0) * (vecB[i] || 0);
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Score de compatibilité des compétences
const calculateCompetenceScore = (mentorCompetences, mentoreCompetences) => {
  if (!mentoreCompetences.length) return 0.5;
  
  const mentoreSet = new Set(mentoreCompetences.map(c => c.toLowerCase()));
  const mentorSet = new Set(mentorCompetences.map(c => c.toLowerCase()));
  
  let matchCount = 0;
  for (const comp of mentoreSet) {
    if (mentorSet.has(comp)) matchCount++;
  }
  
  // Score basé sur le nombre de compétences correspondantes
  return matchCount / Math.max(mentoreSet.size, 1);
};

// Score de compatibilité des disponibilités
const calculateAvailabilityScore = (mentorDispos, mentorePrefs) => {
  if (!mentorDispos.length) return 0.3;
  if (!mentorePrefs || !mentorePrefs.length) return 0.5;
  
  // Pour l'instant, retourne un score basé sur la disponibilité générale
  // À améliorer avec une vraie correspondance horaire
  return mentorDispos.length > 0 ? 0.7 : 0.3;
};

// Score basé sur la réputation du mentor
const calculateReputationScore = (noteMoyenne, nbSessions) => {
  // Note sur 5 convertie en score sur 1
  const noteScore = noteMoyenne / 5;
  
  // Bonus pour l'expérience (plus de sessions)
  const experienceBonus = Math.min(nbSessions / 50, 0.2);
  
  return Math.min(noteScore + experienceBonus, 1);
};

// Score basé sur les objectifs d'apprentissage (TF-IDF simplifié)
const calculateObjectivesScore = (mentorBio, mentoreObjectives) => {
  if (!mentoreObjectives || !mentoreObjectives.length) return 0.5;
  if (!mentorBio) return 0.3;
  
  const mentorWords = mentorBio.toLowerCase().split(/\s+/);
  const objectiveWords = mentoreObjectives.toLowerCase().split(/\s+/);
  
  const uniqueWords = new Set([...mentorWords, ...objectiveWords]);
  let matchCount = 0;
  
  for (const word of objectiveWords) {
    if (word.length > 3 && mentorWords.includes(word)) {
      matchCount++;
    }
  }
  
  return Math.min(matchCount / Math.max(objectiveWords.length, 1), 1);
};

const calculateGlobalScore = (scores) => {
  const weights = {
    competences: 0.35,
    disponibilites: 0.20,
    objectifs: 0.25,
    reputation: 0.20
  };
  
  return (
    scores.competences * weights.competences +
    scores.disponibilites * weights.disponibilites +
    scores.objectifs * weights.objectifs +
    scores.reputation * weights.reputation
  );
};

const calculateMatchingForMentore = async (mentoreId) => {
  try {
    // 1. Récupérer les infos du mentoré
    const mentoreResult = await query(
      `SELECT pme.id, pme.objectifs, pme.objectifs_tags, pme.domaine,
              u.id as user_id
       FROM profils_mentore pme
       JOIN utilisateurs u ON u.id = pme.utilisateur_id
       WHERE pme.id = $1`,
      [mentoreId]
    );
    
    if (mentoreResult.rows.length === 0) {
      throw new Error('Mentoré non trouvé');
    }
    
    const mentore = mentoreResult.rows[0];
    const mentoreObjectifs = mentore.objectifs || '';
    const mentoreTags = mentore.objectifs_tags || [];
    
    // 2. Récupérer tous les mentors actifs
    const mentorsResult = await query(
      `SELECT pm.id, pm.bio, pm.domaine, pm.note_moyenne, pm.nb_sessions,
              u.id as user_id, u.nom, u.prenom
       FROM profils_mentor pm
       JOIN utilisateurs u ON u.id = pm.utilisateur_id
       WHERE u.actif = true AND pm.disponible = true`
    );
    
    const scores = [];
    
    for (const mentor of mentorsResult.rows) {
      // 3. Récupérer les compétences du mentor
      const competencesResult = await query(
        `SELECT c.nom
         FROM mentor_competences mc
         JOIN competences c ON c.id = mc.competence_id
         WHERE mc.mentor_id = $1`,
        [mentor.id]
      );
      const mentorCompetences = competencesResult.rows.map(r => r.nom);
      
      // 4. Récupérer les disponibilités du mentor
      const disposResult = await query(
        `SELECT jour_semaine, heure_debut, heure_fin
         FROM disponibilites
         WHERE mentor_id = $1`,
        [mentor.id]
      );
      
      // 5. Calculer les différents scores
      const competenceScore = calculateCompetenceScore(mentorCompetences, mentoreTags);
      const availabilityScore = calculateAvailabilityScore(disposResult.rows, []);
      const objectivesScore = calculateObjectivesScore(mentor.bio, mentoreObjectifs);
      const reputationScore = calculateReputationScore(mentor.note_moyenne, mentor.nb_sessions);
      
      // 6. Score global
      const globalScore = calculateGlobalScore({
        competences: competenceScore,
        disponibilites: availabilityScore,
        objectifs: objectivesScore,
        reputation: reputationScore
      });
      
      scores.push({
        mentor_id: mentor.id,
        mentor_user_id: mentor.user_id,
        mentor_nom: `${mentor.prenom} ${mentor.nom}`,
        mentor_domaine: mentor.domaine,
        mentor_note: mentor.note_moyenne,
        score: parseFloat(globalScore.toFixed(4)),
        details: {
          competences: parseFloat(competenceScore.toFixed(4)),
          disponibilites: parseFloat(availabilityScore.toFixed(4)),
          objectifs: parseFloat(objectivesScore.toFixed(4)),
          reputation: parseFloat(reputationScore.toFixed(4))
        }
      });
    }
    
    // Trier par score décroissant
    scores.sort((a, b) => b.score - a.score);
    
    return scores;
  } catch (error) {
    console.error('Erreur calcul matching:', error);
    throw error;
  }
};

const saveMatchingScores = async (mentoreId, scores) => {
  try {
    for (const score of scores) {
      await query(
        `INSERT INTO matching_scores (mentore_id, mentor_id, score, score_competences, 
         score_dispo, score_objectifs, score_reputation, details_calcul, calcule_le)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (mentore_id, mentor_id) 
         DO UPDATE SET 
           score = EXCLUDED.score,
           score_competences = EXCLUDED.score_competences,
           score_dispo = EXCLUDED.score_dispo,
           score_objectifs = EXCLUDED.score_objectifs,
           score_reputation = EXCLUDED.score_reputation,
           details_calcul = EXCLUDED.details_calcul,
           calcule_le = NOW()`,
        [
          mentoreId,
          score.mentor_id,
          score.score,
          score.details.competences,
          score.details.disponibilites,
          score.details.objectifs,
          score.details.reputation,
          JSON.stringify(score.details)
        ]
      );
    }
  } catch (error) {
    console.error('Erreur sauvegarde scores:', error);
  }
};

const recalculateAllMatchings = async () => {
  try {
    const mentoresResult = await query(
      'SELECT id FROM profils_mentore'
    );
    
    for (const mentore of mentoresResult.rows) {
      const scores = await calculateMatchingForMentore(mentore.id);
      await saveMatchingScores(mentore.id, scores);
    }
    
    console.log(`✅ Matching recalculé pour ${mentoresResult.rows.length} mentorés`);
    return { success: true, count: mentoresResult.rows.length };
  } catch (error) {
    console.error('Erreur recalcul global:', error);
    throw error;
  }
};

module.exports = {
  calculateMatchingForMentore,
  saveMatchingScores,
  recalculateAllMatchings,
  cosineSimilarity
};