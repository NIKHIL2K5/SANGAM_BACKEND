import mongoose from "mongoose";

const chatschema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: String,
        type: { type: String, enum: ['text', 'image', 'video'], default: 'text' },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }]
})

export default mongoose.model('Chat', chatschema);