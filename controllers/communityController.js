import { request, response } from "express"
import Community from "../models/Community.js"
import CommunityMessage from "../models/CommunityMessage.js"
import User from "../models/User.js"

export const createCommunity=async(request,response)=>{
    try{
        const {name,description,region,language,members}=request.body
        if (!name) return response.status(400).json({message:'name is required'})
        let memberIds = Array.isArray(members) ? members.map(String) : []
        memberIds.push(String(request.user.id))
        memberIds = Array.from(new Set(memberIds))
        if (memberIds.length>0){
            const count = await User.countDocuments({_id:{$in:memberIds}})
            if (count !== memberIds.length) return response.status(400).json({message:'One or more members are invalid users'})
        }
        const community=new Community({name,description,region,language,members:memberIds, createdBy:request.user.id})
        await community.save()
        response.status(201)
        response.json(community)
    }catch(error){
        response.status(500)
        response.json({message:error.message})
    }
}

export const listMyCommunities = async (request, response) => {
    try {
        const userId = request.user?.id;
        if (!userId) return response.status(401).json({ message: 'Not authenticated' });
        const list = await Community.find({ members: userId }).select("_id name avatar").sort({ createdAt: -1 });
        response.status(200).json(list);
    } catch (error) {
        response.status(500).json({ message: error.message })
    }
}

export const getCommunity=async(request,response)=>{
     try{
        const userId = request.user?.id;
        if (!userId) return response.status(401).json({ message: 'Not authenticated' });
        const communities=await Community.findById(request.params.communityid).populate('members').populate('posts')
        if (!communities) return response.status(404).json({message:'Community not found'})
        const isMember = (communities.members || []).map((m)=>String(m._id || m)).includes(String(userId))
        if (!isMember) return response.status(403).json({message:'Not a member'})
        response.status(200)
        response.json(communities)
    }catch(error){
        response.status(500).json({message:error.message})
    }
}

export const getCommunityMessages = async (request, response) => {
    try {
        const communityId = request.params.communityid;
        const userId = request.user?.id;
        if (!userId) return response.status(401).json({ message: 'Not authenticated' });
        const comm = await Community.findById(communityId).select('members');
        if (!comm) return response.status(404).json({ message: 'Community not found' });
        if (!comm.members.map(String).includes(String(userId))) return response.status(403).json({ message: 'Not a member' });
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
        if (!sender) return response.status(401).json({ message: 'Not authenticated' });
        const comm = await Community.findById(communityId).select('members');
        if (!comm) return response.status(404).json({ message: 'Community not found' });
        if (!comm.members.map(String).includes(String(sender))) return response.status(403).json({ message: 'Not a member' });
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

export const addCommunityMembers = async (request, response) => {
    try {
        const communityId = request.params.communityid;
        const { members } = request.body;
        if (!Array.isArray(members) || members.length === 0) return response.status(400).json({ message: 'members array required' });
        const ids = Array.from(new Set(members.map(String)));
        const validCount = await User.countDocuments({ _id: { $in: ids } });
        if (validCount !== ids.length) return response.status(400).json({ message: 'One or more members are invalid users' });
        const updated = await Community.findByIdAndUpdate(
            communityId,
            { $addToSet: { members: { $each: ids } } },
            { new: true }
        ).populate('members');
        if (!updated) return response.status(404).json({ message: 'Community not found' });
        response.status(200).json(updated);
    } catch (error) {
        response.status(500).json({ message: error.message })
    }
}

export const removeCommunityMembers = async (request, response) => {
    try {
        const communityId = request.params.communityid;
        const { members } = request.body;
        if (!Array.isArray(members) || members.length === 0) return response.status(400).json({ message: 'members array required' });
        const ids = Array.from(new Set(members.map(String)));
        const updated = await Community.findByIdAndUpdate(
            communityId,
            { $pull: { members: { $in: ids } } },
            { new: true }
        ).populate('members');
        if (!updated) return response.status(404).json({ message: 'Community not found' });
        response.status(200).json(updated);
    } catch (error) {
        response.status(500).json({ message: error.message })
    }
}