import Post from "../models/Post.js"
import mongoose from "mongoose";
import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";

export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const author = req.user._id;
    let mediaUrl = null;

    // 🧠 If a file exists, upload it to Cloudinary
    if (req.file) {
      const uploadStream = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };

      const result = await uploadStream();
      mediaUrl = result.secure_url;
    }

    // 🧩 Validation
    if (!content?.trim() && !mediaUrl) {
      return res.status(400).json({ message: "Post must have text or media." });
    }

    // 🧱 Save post to database
    const post = new Post({
      author,
      content,
      media: mediaUrl,
    });

    await post.save();

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Upload error in createPost:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getPosts = async (request, response) => {
  try {
    const posts = await Post.find()
      .populate('author')
      .populate({ path: 'comments', populate: { path: 'author' } });
    response.status(200).json(posts)
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const likePost = async (request, response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(request.params.id)) {
      return response.status(400).json({ message: "Invalid post id" });
    }
    const postId = request.params.id;
    const userId = request.user._id;

    const hasLiked = await Post.exists({ _id: postId, likes: userId });
    if (hasLiked) {
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
    } else {
      await Post.updateOne({ _id: postId }, { $addToSet: { likes: userId } });
    }

    const populated = await Post.findById(postId)
      .populate('author')
      .populate({ path: 'comments', populate: { path: 'author' } });

    response.status(200).json(populated);
  } catch (error) {
    console.error('likePost error:', error && error.stack ? error.stack : error);
    response.status(500).json({ message: error.message });
  }
}

export const sharePost = async (request, response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(request.params.id)) {
      return response.status(400).json({ message: "Invalid post id" });
    }
    const postId = request.params.id;
    const exists = await Post.exists({ _id: postId });
    if (!exists) return response.status(404).json({ message: "Post not found" });
    await Post.updateOne({ _id: postId }, { $inc: { shares: 1 } });

    const populated = await Post.findById(postId)
      .populate('author')
      .populate({ path: 'comments', populate: { path: 'author' } });

    response.status(200).json(populated);
  } catch (error) {
    console.error('sharePost error:', error && error.stack ? error.stack : error);
    response.status(500).json({ message: error.message });
  }
}