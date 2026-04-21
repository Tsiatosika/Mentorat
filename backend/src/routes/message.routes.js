const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const messageController = require('../controllers/message.controller');

// Toutes les routes nécessitent authentification
router.use(authenticate);

router.get('/session/:session_id', messageController.getMessagesBySession);
router.put('/session/:session_id/read', messageController.markSessionAsRead);
router.get('/unread/count', messageController.getUnreadCount);

module.exports = router;