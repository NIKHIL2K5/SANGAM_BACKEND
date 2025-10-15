import express from 'express'
import { createChat,sendMessage,getChat, getDmHistory, sendDmMessage, getUserConversations } from '../controllers/chatController.js';
import auth from '../middleware/authMiddleware.js';

const router=express.Router();


router.post('/',auth,createChat);
router.post('/message',auth,sendMessage)
router.get('/dm/:otherUserId/history', auth, getDmHistory)
router.post('/dm/send', auth, sendDmMessage)
router.get('/:chatid',auth,getChat)
router.get('/conversations/list', auth, getUserConversations)

export default router;