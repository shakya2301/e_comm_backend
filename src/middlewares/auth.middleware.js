import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import {User} from '../models/users.model.js';
import {Cart} from '../models/carts.model.js';
import {Seller} from '../models/sellers.model.js';
import {Product} from '../models/products.model.js';
import {Category} from '../models/categories.model.js';
import {Order} from '../models/orders.model.js';
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
        req.usercart = await Cart.findOne({user: user._id});

        next();
    } catch (error) {
        throw new apiError(401, error.message || "Invalid token last");
    }
})

export const verifieduserauth = asyncHandler(async(req,res,next,err)=>{
    const userid = req.user._id;
    if(!userid) {
        throw new apiError(401,"No token provided, please login")
    }
    const isverified = await User.findById(userid).select("isVerified");

    if(isverified.isVerified ==true) next();

    // console.log(isadmin.isAdmin);
    else throw new apiError(401, "Unauthorized, User not verified");
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

export const sellerverifiedauth = asyncHandler(async(req,res,next,err)=>{
    const sellerid = req.seller._id;
    if(!sellerid) {
        throw new apiError(401,"No token provided, please login")
    }
    const isseller = await Seller.findById(sellerid).select("isVerified");

    if(isseller.isVerified ==true) next();

    // console.log(isadmin.isAdmin);
    else throw new apiError(401, "Unauthorized, Seller not verified");
})

export const sellerauthorizedauth = asyncHandler(async(req,res,next,err)=>{
    const sellerid = req.seller._id;
    if(!sellerid) {
        throw new apiError(401,"No token provided, please login")
    }
    const isseller = await Seller.findById(sellerid).select("isAuthorized");

    if(isseller.isAuthorized ==true) next();

    // console.log(isadmin.isAdmin);
    else throw new apiError(401, "Unauthorized, Seller not authorized");
})