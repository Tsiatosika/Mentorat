const express = require('express');
const router = express.Router();
const { query } = require('../config/db');


router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, nom, icone, couleur FROM categories ORDER BY nom'
    );
    res.json({ success: true, categories: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;