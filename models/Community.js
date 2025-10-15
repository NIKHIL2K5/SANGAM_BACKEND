import mongoose from "mongoose";

const communitySchema=new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    description:String,
    language:{
        type:String,
        default:'en'
    },
    region:String,
    members:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    posts:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Post'
    }],
    createdBy:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }]
}
)

export default mongoose.model("Community",communitySchema);