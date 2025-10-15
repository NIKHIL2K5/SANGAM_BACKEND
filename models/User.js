import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
   username: {
      type: String,
      require: true,
      unique: true
   },
   email: {
      type: String,
      require: true,
      unique: true
   },
   password: {
      type: String,
      require: true
   },
   bio: String,

   profilePicture: String,

   languagePreference: {
      type: String,
      default: 'en'
   },
   followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   }],
   following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   }],
   role: {
      type: String,
      enum: ['admin', 'user', 'guest'],
      default: "user"
   },
   isVerified: {
      type: Boolean,
      default: false
   }
});


export default mongoose.model("User", userSchema)
