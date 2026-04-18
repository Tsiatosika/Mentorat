const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticate } = require('../middlewares/auth');

router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, nom, categorie FROM competences ORDER BY categorie, nom'
    );
    
    res.json({ 
      success: true, 
      competences: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res, next) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Le paramètre de recherche "q" est requis'
    });
  }
  
  try {
    const result = await query(
      `SELECT id, nom, categorie 
       FROM competences 
                       WHERE nom ILIKE $1 
       ORDER BY nom 
       LIMIT 20`,
      [`%${q}%`]
    );
    
    res.json({ 
      success: true, 
      competences: result.rows,
      count: result.rows.length,
      recherche: q
    });
  } catch (error) {
    next(error);
  }
});


router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const result = await query(
      'SELECT id, nom, categorie FROM competences WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Compétence non trouvée'
      });
    }
    
    res.json({ 
      success: true, 
      competence: result.rows[0] 
    });
  } catch (error) {
    next(error);
  }
});


router.get('/categorie/:categorie', async (req, res, next) => {
  const { categorie } = req.params;
  
  try {
    const result = await query(
      'SELECT id, nom, categorie FROM competences WHERE categorie ILIKE $1 ORDER BY nom',
      [`%${categorie}%`]
    );
    
    res.json({ 
      success: true, 
      categorie: categorie,
      competences: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});


router.get('/mentor/:mentorId', async (req, res, next) => {
  const { mentorId } = req.params;
  
  try {
    // Vérifier que le mentor existe
    const mentorCheck = await query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.photo_url,
              pm.domaine, pm.note_moyenne, pm.nb_sessions
       FROM utilisateurs u
       JOIN profils_mentor pm ON pm.utilisateur_id = u.id
       WHERE u.id = $1 AND u.role = 'mentor' AND u.actif = true`,
      [mentorId]
    );
    
    if (mentorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mentor non trouvé'
      });
    }
    
    // Récupérer les compétences du mentor
    const result = await query(
      `SELECT c.id, c.nom, c.categorie, mc.niveau
       FROM mentor_competences mc
       JOIN competences c ON c.id = mc.competence_id
       WHERE mc.mentor_id = (SELECT id FROM profils_mentor WHERE utilisateur_id = $1)
       ORDER BY c.nom`,
      [mentorId]
    );
    
    res.json({ 
      success: true, 
      mentor: mentorCheck.rows[0],
      competences: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  const { nom, categorie } = req.body;
  
  if (!nom) {
    return res.status(400).json({
      success: false,
      message: 'Le nom de la compétence est requis'
    });
  }
  
  try {
    // Vérifier si la compétence existe déjà
    const existing = await query(
      'SELECT id FROM competences WHERE nom ILIKE $1',
      [nom]
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cette compétence existe déjà'
      });
    }
    
    const result = await query(
      'INSERT INTO competences (nom, categorie) VALUES ($1, $2) RETURNING *',
      [nom, categorie || null]
    );
    
    res.status(201).json({
      success: true,
      message: 'Compétence créée avec succès',
      competence: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});


router.put('/:id', authenticate, async (req, res, next) => {
  const { id } = req.params;
  const { nom, categorie } = req.body;
  
  try {
    const result = await query(
      `UPDATE competences 
       SET nom = COALESCE($1, nom),
           categorie = COALESCE($2, categorie)
       WHERE id = $3
       RETURNING *`,
      [nom, categorie, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Compétence non trouvée'
      });
    }
    
    res.json({
      success: true,
      message: 'Compétence mise à jour avec succès',
      competence: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});


router.delete('/:id', authenticate, async (req, res, next) => {
  const { id } = req.params;
  
  try {
    // Vérifier si la compétence est utilisée par des mentors
    const used = await query(
      'SELECT COUNT(*) FROM mentor_competences WHERE competence_id = $1',
      [id]
    );
    
    if (parseInt(used.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cette compétence est utilisée par des mentors, suppression impossible'
      });
    }
    
    const result = await query(
      'DELETE FROM competences WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Compétence non trouvée'
      });
    }
    
    res.json({
      success: true,
      message: 'Compétence supprimée avec succès'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;