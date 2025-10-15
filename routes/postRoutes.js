import express from 'express';
import { createPost, getPosts, likePost, sharePost } from '../controllers/postController.js';
import auth from '../middleware/authMiddleware.js';
import upload from '../utils/uploadHelper.js';

const router = express.Router();


router.post('/', auth, upload.single('file'), createPost);
router.get('/', getPosts);
router.put('/:id/like', auth, likePost);
router.put('/:id/share', auth, sharePost);

export default router;