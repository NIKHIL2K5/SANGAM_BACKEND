import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (request, response, next) => {
  try {
    let token = request.cookies.token;
    // Fallback to Authorization header if cookie not present
    if (!token && request.headers.authorization) {
      token = request.headers.authorization;
      if (token.startsWith('Bearer ')) {
        token = token.slice(7);
      }
    }
    if (!token) {
      console.log('AuthMiddleware: No token found in cookie or header');
      return response.status(401).json({ message: "Not authorized, no token" });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log('AuthMiddleware: Invalid token', err.message);
      return response.status(401).json({ message: "Not authorized, invalid token" });
    }
    request.user = await User.findById(decoded.id).select("-password");
    if (!request.user) {
      console.log('AuthMiddleware: User not found for decoded id', decoded.id);
      return response.status(401).json({ message: "User not found" });
    }
    next();
  } catch (error) {
    console.log('AuthMiddleware: Unexpected error', error.message);
    return response.status(401).json({ message: "Not authorized, unexpected error" });
  }
};

export default auth;
