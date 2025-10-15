import { request, response } from "express";

export const notFound=(request,response,next)=>{
    const error=new Error("Not found")
    response.status(401)
    next(error)
};

export const errorHandling=(error,request,response,next)=>{
    const statusCode=response.statusCode===200?500:response.statusCode;
    response.status(statusCode)

    response.json({
        message:error.message,
    })
}


