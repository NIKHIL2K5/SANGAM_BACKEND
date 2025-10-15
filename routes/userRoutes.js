import express from 'express';
import { registerUser, loginUser, getUserProfile, getCurrentUserProfile, followUser, searchUsers } from "../controllers/userController.js"
import auth from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/profile', auth, getCurrentUserProfile);
router.get('/search', auth, searchUsers)
router.get('/:id', auth, getUserProfile)
router.put('/:id/follow', auth, followUser)

export default router;