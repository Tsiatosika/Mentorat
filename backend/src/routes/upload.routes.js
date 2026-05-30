const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { upload, uploadPhoto, uploadCV } = require('../controllers/upload.controller');

router.use(authenticate);

router.post('/photo', upload.single('photo'), uploadPhoto);
router.post('/cv', upload.single('cv'), uploadCV);

module.exports = router;
