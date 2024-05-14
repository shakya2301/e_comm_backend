import {Subcategory} from '../models/subcategories.model.js';
import {Category} from '../models/categories.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import {apiResponse} from '../utils/apiResponse.js';


//works
export const createSubcategory = asyncHandler(async(req,res)=> {
    const {name,description} = req.body;
    const category = await Category.findOne({name: req.params.category});

    console.log(category);
    console.log(name,description);

    if(!name || !description){
        res.status(400);
        throw new apiError(400, 'All fields are required');
    }
    if(!category){
        res.status(404);
        throw new apiError(404, 'Parent Category not found');
    }

    if(await Subcategory.findOne({
        $and: [{name}, {category: category._id}]
    })){
        res.status(400);
        throw new apiError(400, 'Subcategory already exists for this category');
    }

    const subcategory = await Subcategory.create({
        name,
        description,
        category: category._id
    });
    subcategory.save();

    res.status(200)
    .json(
        new apiResponse(200,
        subcategory,
        'Subcategory created successfully')
    )
})

export const getAllSubcategories = asyncHandler(async(req,res)=> {
    const subcategories = await Subcategory.find();
    if(!subcategories){
        res.status(404);
        throw new apiError(404, 'No subcategories found');
    }
    if(subcategories.length == 0){
        res.status(404);
        throw new apiError(404, 'No subcategories found');
    }
    res.status(200)
    .json(
        new apiResponse(200,
        subcategories,
        'All subcategories')
    )
})

export const getAllSubcategoriesByCategory = asyncHandler(async(req,res)=> {
    const category = await Category.findOne({name: req.params.category});
    if(!category){
        res.status(404);
        throw new apiError(404, 'Category not found');
    }
    const subcategories = await Subcategory.find({category: category._id});
    if(!subcategories){
        res.status(404);
        throw new apiError(404, 'No subcategories found');
    }
    if(subcategories.length == 0){
        res.status(404);
        throw new apiError(404, 'No subcategories found');
    }
    res.status(200)
    .json(
        new apiResponse(200,
        subcategories,
        'All subcategories for the category')
    )
})

export const updateSubcategory = asyncHandler(async(req,res)=> {
    let {name, description} = req.body;
    const category = await Category.findOne({name: req.params.category});
    const {subcategory} = req.params;
    if(!category){
        res.status(404);
        throw new apiError(404, 'Category not found');
    }
    if(!name && !description){
        res.status(400);
        throw new apiError(400, 'Fill at least one field to update');
    }
    if(!name) name = subcategory;
    if(description === null) description = await Subcategory.findOne({name: subcategory, category: category._id}).select('description').description;

    console.log(name, description);

    const catid = category._id;
    const sc = await Subcategory.findOneAndUpdate({name: subcategory, category: catid},
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    );
    if(!sc){
        res.status(404);
        throw new apiError(404, 'Failed to update subcategory');
    }
    res.status(200)
    .json(
        new apiResponse(200,
        sc,
        'Subcategory updated successfully')
    )
})

export const deleteSubcategory = asyncHandler(async(req,res)=> {
    const {category, subcategory} = req.params;
    const cat = await Category.findOne({name: category});
    if(!cat){
        res.status(404);
        throw new apiError(404, 'Category not found');
    }
    const sc = await Subcategory.findOneAndDelete({name: subcategory, category: cat._id});
    if(!sc){
        throw new apiError(404, 'Failed to delete subcategory');
    }
    res.status(200)
    .json(
        new apiResponse(200,
        sc,
        'Subcategory deleted successfully')
    )
})