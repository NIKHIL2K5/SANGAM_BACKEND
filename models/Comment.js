import mongoose from "mongoose";

const commentsSchema=new mongoose.Schema({
    postId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Post',
        require:true
    },
    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        require:true
    },
    content:{
        type:String,
        require:true
    },
    language:{
        type:String,
        default:'en'
    },
    likes:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    isTranslated:{
        type:Boolean,
        default:false
    },
    translation:{
        type:Map,
        of: String
    }
});

export default mongoose.model('Comment',commentsSchema);