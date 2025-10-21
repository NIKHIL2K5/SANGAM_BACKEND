import express from 'express';
import { createPayment, confirmPayment, getPaymentbyUser } from '../controllers/paymentController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-checkout-session', auth, createPayment);
router.post('/confirm', auth, confirmPayment);
router.get('/:userId', auth, getPaymentbyUser);

export default router;