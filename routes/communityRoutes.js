import express from 'express'
import { createCommunity,getCommunity, getCommunityMessages, sendCommunityMessage, addCommunityMembers, removeCommunityMembers, listMyCommunities } from '../controllers/communityController.js';
import auth from "../middleware/authMiddleware.js"


const router=express.Router()

router.post("/",auth,createCommunity)
router.get('/my', auth, listMyCommunities)
router.get('/:communityid', auth, getCommunity)
router.get('/:communityid/messages', auth, getCommunityMessages)
router.post('/:communityid/messages', auth, sendCommunityMessage)
router.post('/:communityid/members/add', auth, addCommunityMembers)
router.post('/:communityid/members/remove', auth, removeCommunityMembers)


export default router;