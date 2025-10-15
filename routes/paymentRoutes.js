import express from 'express'
import {createPayment,getPaymentbyUser} from '../controllers/paymentController.js';
import auth from '../middleware/authMiddleware.js';

const router=express.Router()

router.post('/',auth,createPayment)
router.get('/:userId',auth,getPaymentbyUser)

export default router;