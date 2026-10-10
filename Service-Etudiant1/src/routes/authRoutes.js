const express = require('express');
const router = express.Router();
const { generateToken, verifyToken } = require('../controllers/authController');

// Routes d'authentification (publiques pour le développement/test)
router.post('/generate-token', generateToken);
router.post('/verify-token', verifyToken);

module.exports = router;

