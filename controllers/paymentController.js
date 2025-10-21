import Stripe from "stripe";
import Payment from "../models/Payment.js";

let stripeInstance;
const getStripe = () => {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment");
    }
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
};

export const createPayment = async (req, res) => {
  const { amount, to } = req.body;
  const from = req.user._id;

  if (!amount || !to) return res.status(400).json({ message: "Amount and recipient required" });

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Support to ${to}` },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&to=${to}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancelled`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const confirmPayment = async (req, res) => {
  const { sessionId, to } = req.body;
  const from = req.user._id;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const payment = new Payment({
      from,
      to,
      amount: session.amount_total / 100,
      paymentMethod: session.payment_method_types[0],
      transactionId: session.id,
    });

    await payment.save();
    res.status(201).json({ message: "Payment saved", payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getPaymentbyUser = async (req, res) => {
  try {
    const payment = await Payment.find({ from: req.params.userId });
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
