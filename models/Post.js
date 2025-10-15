import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: false 
    },
    media: { type: String, default: null },
    language: {
        type: String,
        default: 'en'
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    shares: {
        type: Number,
        default: 0
    },
    isTranslated: {
        type: Boolean,
        default: false
    },
    translation: {
        type: Map,
        of: String
    }
}, { timestamps: true }
)

export default mongoose.model("Post", postSchema);