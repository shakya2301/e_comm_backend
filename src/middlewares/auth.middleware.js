import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import {User} from '../models/users.model.js';
import apiError from '../utils/apiError.js';

export const authjwt = asyncHandler( async(req,res,next,err)=>{
    const incomingToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if(!incomingToken) {
        throw new apiError(401,"No token provided, please login")
    }

    try {
        const decodedToken = jwt.verify(incomingToken, `${process.env.ACCESS_TOKEN_SECRET}`);

        if(!decodedToken) {
            throw new apiError(401,"Invalid token");
        }

        const user = await User.findById(decodedToken.id).select("-password -refreshToken");
        if(!user) {
            throw new apiError(404,"User not found, invalid token");
        }
        req.user = user;

        next();
    } catch (error) {
        throw new apiError(401, error.message || "Invalid token last");
    }
})
