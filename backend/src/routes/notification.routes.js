const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const notificationController = require('../controllers/notification.controller');

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;
