import {Brand} from "../models/brands.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import {apiResponse} from "../utils/apiResponse.js";
import apiError from "../utils/apiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import slugify from 'slugify';


export const createBrand = asyncHandler(async(req,res)=> {
    const {name} = req.body;
    const logo = req.file?.path;

    console.log(name, logo);
    if(!name || !logo){
        res.status(400);
        throw new apiError(400, 'All fields are required');
    }

    if(await Brand.findOne({name:name})){
        throw new apiError(400, 'Brand already exists');
    }

    const url = await uploadOnCloudinary(logo);
    if(!url){
        res.status(500);
        throw new apiError(500, 'Error uploading image');
    }

    const brand = await Brand.create({
        name,
        logo: url
    });
    brand.save();

    res.status(200)
    .json(
        new apiResponse(200,
        brand,
        'Brand created successfully')
    )
})

export const updateLogo = asyncHandler(async(req,res)=>{
    const {name} = req.params;
    const logo = req.file?.path;

    if(!name || !logo){
        res.status(400);
        throw new apiError(400, 'All fields are required');
    }

    const brand = await Brand.findOne({name:name});
    if(!brand){
        res.status(404);
        throw new apiError(404, 'Brand not found');
    }

    const url = await uploadOnCloudinary(logo);
    if(!url){
        res.status(500);
        throw new apiError(500, 'Error uploading image');
    }

    const oldLogo = brand.logo;
    const parts = oldLogo.split('/');
    const public_id = parts[parts.length - 1].split('.')[0];
    brand.logo = url;
    brand.save();

    await deleteFromCloudinary(public_id);

    res.status(200)
    .json(
        new apiResponse(200,
        brand,
        'Brand logo updated successfully')
    )
})

export const updateBrand = asyncHandler(async(req,res)=>{
    const {name} = req.params;
    const {newName} = req.body;

    if(!name || !newName){
        res.status(400);
        throw new apiError(400, 'All fields are required');
    }

    if(name === newName){
        res.status(400);
        throw new apiError(400, 'New name must be different from old name');
    }

    const brand = await Brand.findOne({name:name});
    if(!brand){
        res.status(404);
        throw new apiError(404, 'Brand not found');
    }

    brand.name = newName;
    brand.save();

    res.status(200)
    .json(
        new apiResponse(200,
        brand,
        'Brand updated successfully')
    )
})

export const getAllBrands = asyncHandler(async(req,res)=>{
    const brands = await Brand.find().select("-__v -_id");
    if(!brands){
        res.status(404);
        throw new apiError(404, 'No brands found');
    }
    if(brands.length == 0){
        res.status(404);
        throw new apiError(404, 'No brands found');
    }
    res.status(200)
    .json(
        new apiResponse(200,
        brands,
        'All brands')
    )
})


export const deleteBrand = asyncHandler(async(req,res)=> {
    const {name} = req.params;
    if(!name){
        res.status(400);
        throw new apiError(400, 'Brand name is required');
    }

    try {
        var brand = await Brand.findOneAndDelete({name:name});
    } catch (error) {
        throw new apiError(404, 'Brand not found');
    }
    res.status(200)
    .json(
        new apiResponse(200,
        {brand},
        'Brand deleted successfully')
    )
})

//pending to delete products if brand is deleted 

//get brands by a category and a subcategory....only possible if their is a product model