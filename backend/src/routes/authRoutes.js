import express from 'express';
import { login, register, refreshToken, logout, getMe, updateProfile, forgotPassword, resetPassword, changePassword, uploadProfilePhoto } from '../controllers/authController.js';
import { protect, optionalAuth } from '../middlewares/authMiddleware.js';
import upload from '../utils/upload.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', optionalAuth, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/profile-photo', protect, upload.single('profilePhoto'), uploadProfilePhoto);

export default router;
