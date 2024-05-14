import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import {User} from '../models/users.model.js';
import {Seller} from '../models/sellers.model.js';
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

export const sellerauth = asyncHandler(async(req,res,next,err)=>{
    const incomingToken = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "");
    if(!incomingToken) {
        throw new apiError(401,"No token provided, please login")
    }

    try {
        const decodedToken = jwt.verify(incomingToken, `${process.env.REFRESH_TOKEN_SECRET}`);

        if(!decodedToken) {
            throw new apiError(401,"Invalid token");
        }

        const seller = await Seller.findById(decodedToken.id).select("-password -refreshToken");
        if(!seller) {
            throw new apiError(404,"Seller not found, invalid token");
        }
        
        req.seller = seller;

        next();
    } catch (error) {
        throw new apiError(401, error.message || "Invalid token last");
    }
})

//check for user's auth status.
export const adminauth = asyncHandler(async(req,res,next,err)=>{
    const userid = req.user._id;
    if(!userid) {
        throw new apiError(401,"No token provided, please login")
    }
    const isadmin = await User.findById(userid).select("isAdmin");

    if(isadmin.isAdmin ==true) next();

    // console.log(isadmin.isAdmin);
    else throw new apiError(401, "Unauthorized, Admin only");
})
