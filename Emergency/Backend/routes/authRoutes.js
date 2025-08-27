import express from 'express';
import { signup, login, logout, checkAuth } from '../controllers/authController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/check-auth', verifyToken, checkAuth);

export default router; 