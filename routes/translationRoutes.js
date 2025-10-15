import express from 'express'
import { createTranslation,getTranslations } from '../controllers/translationController.js';
import auth from '../middleware/authMiddleware.js';

const router=express.Router()

router.post('/',auth,createTranslation);
router.get('/:targetId',getTranslations)

export default router;