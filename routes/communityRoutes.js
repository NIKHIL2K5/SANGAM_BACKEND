import express from 'express'
import { createCommunity,getCommunity, getCommunityMessages, sendCommunityMessage } from '../controllers/communityController.js';
import auth from "../middleware/authMiddleware.js"


const router=express.Router()

router.post("/",auth,createCommunity)
router.get('/:communityid',getCommunity)
router.get('/:communityid/messages', getCommunityMessages)
router.post('/:communityid/messages', auth, sendCommunityMessage)


export default router;