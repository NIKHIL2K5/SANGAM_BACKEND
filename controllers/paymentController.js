import { request, response } from "express"
import Payment from "../models/Payment.js"

export const createPayment=async(request,response)=>{
    try{
        const {from,to,amount,paymentMethod,transactionId}=request.body
        const payment=new Payment({from,to,amount,paymentMethod,transactionId})
        console.log("Payment saved1")
        await payment.save()
        console.log("Payment saved2")
        response.status(201)
        response.json(payment)
    }catch(error){
        response.send(error)
    }
}

export const getPaymentbyUser=async(request,response)=>{
     try{
        const payment=await Payment.find({from:request.params.userId})
        response.status(200).json(payment)
    }catch(error){
        response.status(500)
        response.json({message:error.message})
    }
}

