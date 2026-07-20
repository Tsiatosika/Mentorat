const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { chatWithAI } = require('../services/chatbot');

router.post('/ask', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message requis' });
    }

    const response = await chatWithAI(userId, message);
    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;