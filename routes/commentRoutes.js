import express from 'express'
import { createComment,getCommentByPost, likeComment } from '../controllers/commentController.js';
import auth from '../middleware/authMiddleware.js';


const router=express.Router()

router.post('/',auth,createComment);
router.get('/:postId',getCommentByPost)
router.put('/:id/like',auth,likeComment)

export default router;