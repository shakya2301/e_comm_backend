import { Category } from "../models/categories.model.js";
import { Subcategory } from "../models/subcategories.model.js";
import apiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import slugify from 'slugify';

//works
export const createCategory = asyncHandler(async(req,res)=> {
    let {name, description} = req.body;
    if(!name || !description){
        res.status(400);
        throw new apiError(400 ,'All fields are required');
    }
    name = slugify(name, {lower: true});

    if(await Category.findOne({name:name}))
    {
        res.status(400);
        throw new apiError(400, 'Category already exists');
    }
    const category = await Category.create({name:name, description:description});
    console.log(category)
    const data = await category.save();
    res.status(200)
    .json(
        new apiResponse(200,
            data,
            'Category created successfully')
        )
    })
    
    //works
export const getAllCategories = asyncHandler(async(req,res)=> {
    const categories = await Category.find().select("-__v -_id ");
    if(!categories){
        res.status(404);
        throw new apiError(400, 'No categories found');
    }
    if(categories.length == 0){
        res.status(404);
        throw new apiError(400, 'No categories found');
    }
    res.status(200)
    .json(
        new apiResponse(200,
        categories,
        'All categories')
    )
})

//works
export const getCategoryDetails = asyncHandler(async(req,res)=> {
    const categoryName = req.params.name;
    if(!categoryName){
        res.status(400);
        throw new Error('Category name is required');
    }
    const category = await Category.findOne({name: categoryName}).select("-__v -_id -createdAt -updatedAt");
    if(!category){
        res.status(404);
        throw new Error('Category not found');
    }
    res.status(200)
    .json(
        new apiResponse(200,
        category,
        'Category details fetched successfully')
    )
})

//works
export const updateCategory = asyncHandler(async(req,res)=> {
    const categoryName = req.params.name;
    const {name, description} = req.body;
    if(!categoryName){
        throw new apiError(400, 'Category name is required');
    }

    try{
        var category = await Category.findOneAndUpdate({name: categoryName},
            {$set:{
                   name: name,
                   description: description
             }},
             {new: true}
         );
    }
    catch(err){
        throw new apiError(400, 'MongoDB duplicate name error');
    }


    if(!category){
        throw new apiError(404, 'Category not found');
    }

    res.status(200)
    .json(
        new apiResponse(200,
        category,
        'Category updated successfully')
    )
})

//works
export const deleteCategory = asyncHandler(async(req,res)=> {
    const categoryName = req.params.name;
    if(!categoryName){
        res.status(400);
        throw new Error('Category name is required');
    }
    console.log(categoryName);
    const category = await Category.findOne({name: categoryName});
    if(!category){
        res.status(404);
        throw new Error('Category not found');
    }
    const deletedSubcategories = await Subcategory.deleteMany({ category: category._id });

    const resp = await Category.findOneAndDelete({name: categoryName});
    if(!resp){
        res.status(404);
        throw new Error('Failed To delete category');
    }
    res.status(200)
    .json(
        new apiResponse(200,
        resp,
        'Category deleted successfully')
    )
})