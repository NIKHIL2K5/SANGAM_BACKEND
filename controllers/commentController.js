import { request, response } from "express"
import Comment from "../models/Comment.js"
import Post from "../models/Post.js"
import mongoose from "mongoose"

export const createComment = async(request,response)=>{
    try{
        const {postId,content} = request.body;
        if (!mongoose.Types.ObjectId.isValid(postId)){
            return response.status(400).json({message: 'Invalid post id'})
        }
        const comment=new Comment({postId,author:request.user._id,content});
        await comment.save()
        // Atomic update to avoid re-validating entire Post document (legacy media arrays)
        const resUpdate = await Post.updateOne({_id: postId}, { $addToSet: { comments: comment._id }})
        if (resUpdate.matchedCount === 0){
            return response.status(404).json({message: 'Post not found'})
        }
        const populated = await Comment.findById(comment._id).populate('author')
        response.status(201)
        response.json(populated)
    }
    catch(error){
        response.status(500).json({message: error.message});
        
    }
}

export const getCommentByPost = async(request,response)=>{
    try{
        const comments=await Comment.find({postId:request.params.postId}).populate('author')
        response.status(200).json(comments)
    }catch(error){
        response.status(500).json({message: error.message})
    }
}

export const likeComment = async(request, response) => {
    try{
        const comment = await Comment.findById(request.params.id)
        if (!comment) return response.status(404).json({message: 'Comment not found'})
        const userId = request.user._id.toString()
        if (!Array.isArray(comment.likes)) comment.likes = []
        const idx = comment.likes.findIndex((id)=> id.toString() === userId)
        if (idx >= 0) {
            comment.likes.splice(idx,1)
        } else {
            comment.likes.push(userId)
        }
        await comment.save()
        const populated = await Comment.findById(comment._id).populate('author')
        response.status(200).json(populated)
    }catch(error){
        response.status(500).json({message: error.message})
    }
}