import mongoose from "mongoose";

const communityMessageSchema = new mongoose.Schema({
  community: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: { type: String, required: true },
  type: { type: String, enum: ["text", "image", "video"], default: "text" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("CommunityMessage", communityMessageSchema);
