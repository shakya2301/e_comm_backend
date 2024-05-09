import {User} from '../models/users.model.js'
import asyncHandler from '../utils/asyncHandler.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import {apiResponse} from '../utils/apiResponse.js'
import apiError from '../utils/apiError.js';
import jwt from 'jsonwebtoken';


export const registerUser = asyncHandler(async(req,res)=> {
    const {name, email, password , phone} = req.body;
    const avatar = req.file?.path;
    if(!name || !email || !password || !phone || !avatar) {
        throw new apiError(400,"Please provide all the necessary details")
    }
    const userExists = await User.findOne({email});
    if(userExists) {
        throw new apiError(400,"User already exists")
    }

    const url = await uploadOnCloudinary(avatar);

    const user = new User({
        name,
        email,
        password,
        avatar,
        phone,
        pfp: url
    })
    await user.save();
    res.status(201).json(new apiResponse(201,user,"User registered successfully"));
})

export const loginUser = asyncHandler(async(req,res)=>{
    const {email, password} = req.body;
    if(!email || !password) {
        throw new apiError(400,"Please provide email and password")
    }
    
    const user = await User.findOne({email});
    if(!user) {
        throw new apiError(404,"User not found")
    }
    const match = await user.matchPasswords(password);
    if(!match) {
        throw new apiError(401,"Invalid credentials")
    }

    const accessToken = jwt.sign(
        {
            id: user._id,
            name: user.name,
            email: user.email
        }
        , `${process.env.ACCESS_TOKEN_SECRET}`,
        {
            expiresIn: '1d'
        }
    )

    const refreshToken = jwt.sign(
        {
            id: user._id
        },
        `${process.env.REFRESH_TOKEN_SECRET}`,
        {
            expiresIn: '7d'
        }
    )

    user.refreshToken = refreshToken;
    user.save({validateBeforeSave:false});
    const userdata = await User.findById(user._id).select("-password -refreshToken");

    res.status(200)
    .cookie('accessToken',accessToken,{
        httpOnly: true,
        secure:true
    })
    .cookie('refreshToken',refreshToken,{
        httpOnly: true,
        secure:true
    })
    .json(
        new apiResponse(200, {
            userdata,
            accessToken,
            refreshToken
        })
    )
})

export const logoutUser = asyncHandler(async(req,res)=>{
    if(!req.user){
        throw new apiError(401,"Unauthorized access")
    }
    await User.findByIdAndUpdate(
        req.user.id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )
    // curruser.save({validateBeforeSave:false});

    res.status(200)
    .clearCookie('accessToken')
    .clearCookie('refreshToken')
    .json(new apiResponse(200, "User logged out successfully"));

})

export const refreshAccessToken = asyncHandler( async(req,res)=>{
    const incomingToken = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "");

    if(!incomingToken){
        throw new apiError(401, "No token found, please login");
    }

    const decodedToken = jwt.verify(incomingToken, `${process.env.REFRESH_TOKEN_SECRET}`);
    if(!decodedToken){
        throw new apiError(401, "Invalid token");
    }

    const user = await User.findById(decodedToken.id).select("-password");
    if(!user){
        throw new apiError(404, "User not found, invalid token");
    }
    if(user.refreshToken !== incomingToken){
        throw new apiError(401, "Refresh Token changed, login again");
    }

    const newaccessToken = jwt.sign(
        {
            id: user._id,
            name: user.name,
            email: user.email
        },
        `${process.env.ACCESS_TOKEN_SECRET}`,
        {
            expiresIn: '1d'
        }
    );

    const newrefreshToken = jwt.sign(
        {
            id: user._id
        },
        `${process.env.REFRESH_TOKEN_SECRET}`,
        {
            expiresIn: '7d'
        }
    );

    user.refreshToken = newrefreshToken;
    user.save({validateBeforeSave:false});

    res.status(200)
    .cookie('accessToken',newaccessToken,{
        httpOnly: true,
        secure:true
    })
    .cookie('refreshToken',newrefreshToken,{
        httpOnly: true,
        secure:true
    })
    .json(
        new apiResponse(200, {
            newaccessToken,
            newrefreshToken
        },
    "Token refreshed successfully")
    )
})

