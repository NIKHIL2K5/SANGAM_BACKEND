import { request, response } from "express"
import Community from "../models/Community.js"
import CommunityMessage from "../models/CommunityMessage.js"
 

export const createCommunity=async(request,response)=>{
    try{
        const {name,description,region,language}=request.body
        const community=new Community({name,description,region,language, createdBy:request.user.id})
        await community.save()
        response.status(201)
        response.json(community)
    }catch(error){
        response.status(500)
        response.json({message:error.message})
    }
}

export const getCommunity=async(request,response)=>{
     try{
        const communities=await Community.findById(request.params.communityid).populate('members').populate('posts')
        response.status(200)
        response.json(communities)
    }catch(error){
        response.status(500).json({message:error.message})
    }
}

export const getCommunityMessages = async (request, response) => {
    try {
        const communityId = request.params.communityid;
        const msgs = await CommunityMessage.find({ community: communityId })
            .sort({ createdAt: 1 })
            .limit(200);
        response.status(200).json(msgs);
    } catch (error) {
        response.status(500).json({ message: error.message })
    }
}

export const sendCommunityMessage = async (request, response) => {
    try {
        const communityId = request.params.communityid;
        const { content, type } = request.body;
        const sender = request.user?.id;
        const doc = await CommunityMessage.create({
            community: communityId,
            sender: sender || undefined,
            content,
            type: type || 'text',
            createdAt: new Date()
        });
        response.status(201).json(doc);
    } catch (error) {
        response.status(500).json({ message: error.message })
    }
}