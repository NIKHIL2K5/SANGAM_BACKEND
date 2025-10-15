import mongoose from "mongoose";

const translationSchema=new mongoose.Schema({
    targetType:{
        type:String,
        enum:['post','comment'],
        require:true
    },
    targetId:{
        type:mongoose.Schema.Types.ObjectId,
        require:true
    },
    originalText:String,
    translationText:{type:Map,of:String}
});

export default mongoose.model("Translation",translationSchema)
