import mongoose from "mongoose";

const paymentScheme = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    amount: {
        type: Number,
        require: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    paymentMethod: {
        type: String,
        enum: ['UPI', 'Wallet'],
        require: true
    },
    transactionId: String
});


export default mongoose.model("Payment", paymentScheme);