import User from "../models/User.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { generateToken } from "../utils/generateToken.js";

export const getCurrentUserProfile = async (request, response) => {
    if (!request.user) return response.status(401).json({ message: 'Not authenticated' });
    response.status(200).json(request.user);
};

export const searchUsers = async (request, response) => {
    try {
        const q = (request.query.q || "").toString().trim();
        if (!q) return response.status(200).json([]);
        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const users = await User.find({ $or: [{ username: regex }, { email: regex }] })
            .select("_id username profilepic email")
            .limit(20);
        response.status(200).json(users);
    } catch (error) {
        response.status(500).json({ message: error.message })
    }
}

export const registerUser = async (request, response) => {
    try {
        const { username, email, password } = request.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return response.status(400).json({ "message": "User already Registered" });
        }
        const hashedpassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedpassword });
        await user.save();
        const token = generateToken(user._id);
        const userObject = user.toObject();
        delete userObject.password;
        const isProd = process.env.NODE_ENV === "production";
        const cookieOpts = {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        };
        response
            .cookie("token", token, cookieOpts)
            .status(201)
            .json({ message: "User registered Successfully", user: userObject });
    } catch (error) {
        response.status(500).json({ message: error.message });
    }
};


export const loginUser = async (request, response) => {
    try {
        const { email, password } = request.body;
        const user = await User.findOne({ email });
        if (!user) return response.status(404).json({ message: "User not found" });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return response.status(400).json({ message: "Invalid credentials" });
        const token = generateToken(user._id);
        const userObject = user.toObject();
        delete userObject.password;
        const isProd = process.env.NODE_ENV === "production";
        const cookieOpts = {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        };
        response
            .cookie("token", token, cookieOpts)
            .status(200)
            .json({ user: userObject });
    } catch (error) {
        response.status(500).json({ message: error.message });
    }
};

export const getUserProfile = async (request, response) => {
    try {
        const user = await User.findById(request.params.id).select("-password")
        if (!user) return response.status(404).json({ message: 'User not found' })
        response.status(200).json(user)
    } catch (error) {
        response.status(500).json({ message: error.message })
    }
}


export const followUser = async (request, response) =>{
    try{
        const userId = request.user._id.toString()
        const targetId = request.params.id
        if (userId === targetId) {
            return response.status(400).json({message:"You cannot follow yourself"})
        }

        const me = await User.findById(userId)
        const target = await User.findById(targetId)
        if (!target) return response.status(404).json({message:'User not found'})

        const idx = me.following.findIndex((id)=> id.toString() === targetId)
        if (idx >= 0) {
            me.following.splice(idx,1)
            const fIdx = target.followers.findIndex((id)=> id.toString() === userId)
            if (fIdx >= 0) target.followers.splice(fIdx,1)
        } else {
            me.following.push(targetId)
            target.followers.push(userId)
        }
        await me.save()
        await target.save()

        response.status(200).json({
            me: { _id: me._id, following: me.following },
            target: { _id: target._id, followers: target.followers }
        })
    }catch(error){
        response.status(500).json({message: error.message})
    }
}
