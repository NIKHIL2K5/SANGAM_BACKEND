import Translation from "../models/Translation.js"

export const createTranslation=async(request,response)=>{
    try{
        const {targetType,targetId,originalText,translatedText}=request.body
        const translation=new Translation({targetType,targetId,originalText,translatedText})
        await translation.save()
        response.status(201)
        response.json(translation)
    }catch(error){
        response.status(500)
        response.json({message:error.message})
    }
}

export const getTranslations=async(request,response)=>{
     try{
        const translation = await Translation.find({targetId:request.params.targetId})
        response.status(200)
        response.json(translation)
    }catch(error){
        response.status(500)
        response.json({message:error.message})
    }
}