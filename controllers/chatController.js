import { request, response } from "express";
import Chat from "../models/Chat.js";
import User from "../models/User.js";

export const createChat=async(request,response)=>{
    try{
        const {participants}=request.body
        const chat=new Chat({participants})
        await chat.save()
        response.status(201).json(chat)
    }catch(error){
        response.status(500).json({message:error.message})
    }
}


export const getUserConversations = async (request, response) => {
    try {
        const userId = String(request.user.id);
        const chats = await Chat.find({ participants: userId }).lean();
        // Build list with other participant and last message
        const results = await Promise.all(chats.map(async (c) => {
            const others = (c.participants || []).map(String).filter(id => id !== userId);
            const otherId = others[0] || userId;
            const other = await User.findById(otherId).select('_id username profilepic').lean();
            const last = (c.messages && c.messages.length > 0) ? c.messages[c.messages.length - 1] : null;
            return {
                chatId: String(c._id),
                other: other ? { _id: String(other._id), username: other.username, profilepic: other.profilepic } : { _id: otherId, username: 'Unknown' },
                lastMessage: last ? { _id: String(last._id), content: last.content, sender: String(last.sender), createdAt: last.createdAt } : null
            };
        }));
        response.status(200).json(results);
    } catch (error) {
        response.status(500).json({ message: error.message })
    }
}


export const sendMessage=async(request,response)=>{
    try{
        const {chatId,content,type}=request.body
        const chat = await Chat.findById(chatId)
        chat.messages.push({sender:request.user.id,content,type})
        await chat.save();
        response.status(201).json(chat)
    }catch(error){
        response.status(500).json({message:error.message})
    }
}

export const getChat=async(request,response)=>{
    try{
        const chat=await Chat.findById(request.params.chatid).populate('participants').populate('messages.sender')
        response.status(200).json(chat)
    }catch(error){
        response.status(500).json({message:error.message})
    }
}

export const getDmHistory=async(request,response)=>{
    try{
        const otherUserId = request.params.otherUserId;
        const a = String(request.user.id);
        const b = String(otherUserId);
        const chat = await Chat.findOne({ participants: { $all: [a, b], $size: 2 } });
        const messages = (chat?.messages || []).sort((x,y)=>new Date(x.createdAt)-new Date(y.createdAt));
        response.status(200).json({ participants: [a,b], messages });
    }catch(error){
        response.status(500).json({message:error.message})
    }
}

export const sendDmMessage=async(request,response)=>{
    try{
        const { toUserId, content, type } = request.body;
        const a = String(request.user.id);
        const b = String(toUserId);
        let chat = await Chat.findOne({ participants: { $all: [a, b], $size: 2 } });
        if (!chat) {
            chat = new Chat({ participants: [a, b], messages: [] });
        }
        chat.messages.push({ sender: a, content, type: type || 'text', createdAt: new Date() });
        await chat.save();
        const last = chat.messages[chat.messages.length - 1];
        response.status(201).json({ _id: String(last._id), content: last.content, type: last.type, sender: String(last.sender), createdAt: last.createdAt });
    }catch(error){
        response.status(500).json({message:error.message})
    }
}



