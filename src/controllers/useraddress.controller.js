import { Useraddress } from "../models/useraddress.model.js";
import { User } from "../models/users.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

export const createUserAddress = asyncHandler(async (req,res)=>{
    const {addressLine1,addressLine2,city,state,country} = req.body;
    const user = req.user;
    if(!addressLine1 || !city || !state || !country){
        throw new apiError(400,"Address Line 1, City, State and Country are required");
    }

    const previousAddresses = await Useraddress.find({user:user._id});
    if(previousAddresses.length >= 3){
        throw new apiError(400,"You can only have a maximum of 3 addresses only, delete an existing address to add a new one");
    }

    const userAddress = await Useraddress.create({
        user:user._id,
        addressLine1,
        addressLine2,
        city,
        state,
        country
    });

    res.status(201).json(new apiResponse(userAddress));
})



export const getUserAddresses = asyncHandler(async (req,res)=>{
    const user = req.user;

    if(!user){
        throw new apiError(404,"User not found");
    }

    const userAddresses = await Useraddress.find({user:user._id});

    if(!userAddresses){
        throw new apiError(404,"No addresses found for this user");
    }

    res.status(200).json(
        new apiResponse(200, userAddresses, "Addresses retrieved successfully")
    )
})

export const deleteUserAddress = asyncHandler(async(req,res)=>{
    const {addressId} = req.query;
    const user = req.user;

    if(!addressId){
        throw new apiError(400,"Address ID is required");
    }

    const userAddress = await Useraddress.findOne({_id:addressId, user:user._id});

    if(!userAddress){
        throw new apiError(404,"Address not found");
    }

    const response = await Useraddress.deleteOne({_id:addressId}).exec();

    res.status(200).json(
        new apiResponse(200, response, "Address deleted successfully")
    )
})