const { query } = require('../config/db');
const matchingService = require('../services/matching.service');

const getRecommendations = async (req, res, next) => {
  try {
    // Récupérer l'ID du profil mentoré
    const mentoreResult = await query(
      'SELECT id FROM profils_mentore WHERE utilisateur_id = $1',
      [req.user.id]
    );
    
    if (mentoreResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profil mentoré non trouvé'
      });
    }
    
    const mentoreId = mentoreResult.rows[0].id;
    const { force_recalc = false } = req.query;
    
    let scores;
    
    if (force_recalc === 'true') {
      // Recalcul forcé
      scores = await matchingService.calculateMatchingForMentore(mentoreId);
      await matchingService.saveMatchingScores(mentoreId, scores);
    } else {
      // Récupérer les scores existants
      const scoresResult = await query(
        `SELECT ms.*, 
                u.nom, u.prenom, u.photo_url,
                pm.bio, pm.domaine, pm.note_moyenne, pm.nb_sessions
         FROM matching_scores ms
         JOIN profils_mentor pm ON pm.id = ms.mentor_id
         JOIN utilisateurs u ON u.id = pm.utilisateur_id
         WHERE ms.mentore_id = $1
         ORDER BY ms.score DESC`,
        [mentoreId]
      );
      
      if (scoresResult.rows.length === 0 || force_recalc === 'true') {
        scores = await matchingService.calculateMatchingForMentore(mentoreId);
        await matchingService.saveMatchingScores(mentoreId, scores);
        
        // Recharger les scores
        const newScoresResult = await query(
          `SELECT ms.*, 
                  u.nom, u.prenom, u.photo_url,
                  pm.bio, pm.domaine, pm.note_moyenne, pm.nb_sessions
           FROM matching_scores ms
           JOIN profils_mentor pm ON pm.id = ms.mentor_id
           JOIN utilisateurs u ON u.id = pm.utilisateur_id
           WHERE ms.mentore_id = $1
           ORDER BY ms.score DESC`,
          [mentoreId]
        );
        
        return res.json({
          success: true,
          recommendations: newScoresResult.rows,
          recalculated: true
        });
      }
      
      return res.json({
        success: true,
        recommendations: scoresResult.rows,
        recalculated: false
      });
    }
    
    res.json({
      success: true,
      recommendations: scores,
      recalculated: true
    });
    
  } catch (error) {
    next(error);
  }
};

const getTopMentors = async (req, res, next) => {
  const { limit = 10 } = req.query;
  
  try {
    const result = await query(
      `SELECT u.id, u.nom, u.prenom, u.photo_url,
              pm.bio, pm.domaine, pm.note_moyenne, pm.nb_sessions,
              ARRAY_AGG(DISTINCT c.nom) FILTER (WHERE c.nom IS NOT NULL) as competences
       FROM profils_mentor pm
       JOIN utilisateurs u ON u.id = pm.utilisateur_id
       LEFT JOIN mentor_competences mc ON mc.mentor_id = pm.id
       LEFT JOIN competences c ON c.id = mc.competence_id
       WHERE u.actif = true AND pm.disponible = true
       GROUP BY u.id, pm.id
       ORDER BY pm.note_moyenne DESC, pm.nb_sessions DESC
       LIMIT $1`,
      [limit]
    );
    
    res.json({
      success: true,
      top_mentors: result.rows
    });
  } catch (error) {
    next(error);
  }
};

const recalculateAll = async (req, res, next) => {
  try {
    const result = await matchingService.recalculateAllMatchings();
    res.json({
      success: true,
      message: `Matching recalculé pour ${result.count} mentorés`,
      count: result.count
    });
  } catch (error) {
    next(error);
  }
};

const getMentorScores = async (req, res, next) => {
  const { mentorId } = req.params;
  
  try {
    const result = await query(
      `SELECT ms.*, pme.objectifs
       FROM matching_scores ms
       JOIN profils_mentore pme ON pme.id = ms.mentore_id
       WHERE ms.mentor_id = $1
       ORDER BY ms.score DESC`,
      [mentorId]
    );
    
    res.json({
      success: true,
      scores: result.rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  getTopMentors,
  recalculateAll,
  getMentorScores
};