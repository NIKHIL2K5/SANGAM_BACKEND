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
        enum: ['UPI', 'Wallet','card'],
        require: true
    },
    transactionId: String
},{timestamps:true});


export default mongoose.model("Payment", paymentScheme);