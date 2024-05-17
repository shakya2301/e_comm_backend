import { Subcategory } from "../models/subcategories.model.js";
import { Category } from "../models/categories.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import slugify from "slugify";

//works
export const createSubcategory = asyncHandler(async (req, res) => {
  let { name, description } = req.body;
  const category = await Category.findOne({ name: req.params.category });

  if (!category) {
    res.status(404);
    throw new apiError(404, "Parent Category not found");
  }
  // console.log(category);
  // console.log(name, description);
  name= slugify(name, {lower: true});
  if(await Subcategory.findOne({name, category: category._id})){
    res.status(400);
    throw new apiError(400, "Subcategory already exists for this category");
  }

  if (!name || !description) {
    res.status(400);
    throw new apiError(400, "All fields are required");
  }

  if (
    await Subcategory.findOne({
      $and: [{ name }, { category: category._id }],
    })
  ) {
    res.status(400);
    throw new apiError(400, "Subcategory already exists for this category");
  }

  const subcategory = await Subcategory.create({
    name,
    description,
    category: category._id,
  });
  subcategory.save();

  res
    .status(200)
    .json(
      new apiResponse(200, subcategory, "Subcategory created successfully")
    );
});

export const getAllSubcategories = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to first page
  const limit = parseInt(req.query.limit) || 10; // Default limit to 10 documents
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $lookup: {
        from: "categories", // This should match the name of the collection where categories are stored
        localField: "category", // The field in the subCategory collection
        foreignField: "_id", // The field in the category collection to match on
        as: "parentCategory", // The name of the new array field to add to the result documents
      },
    },
    {
      $unwind: "$parentCategory", // Convert the parentCategory field from an array to an object
    },
    {
      $project: {
        // Include other fields as needed, for example:
        name: 1,
        // description: 1,
        // category: 1,
        // Add a field for the parent category name
        parentCategory: "$parentCategory.name",
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ];

  const subcategories = Array(await Subcategory.aggregate(pipeline));
  if (!subcategories || subcategories.length == 0) {
    throw new apiError(404, "No subcategories found");
  }

  res
    .status(200)
    .json(new apiResponse(200, subcategories, "All subcategories"));
});

export const getAllSubcategoriesByCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ name: req.params.category });
  if (!category) {
    res.status(404);
    throw new apiError(404, "Category not found");
  }

  const page = parseInt(req.query.page) || 1; // Default to first page
  const limit = parseInt(req.query.limit) || 10; // Default limit to 10 documents
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: {
        category: category._id,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "parentCategory",
      },
    },
    {
      $unwind: "$parentCategory",
    },
    {
      $project: {
        name: 1,
        parentCategory: "$parentCategory.name",
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ];

  const subcategories = await Subcategory.aggregate(pipeline);

  res
    .status(200)
    .json(
      new apiResponse(200, subcategories, "All subcategories for the category")
    );
});

export const updateSubcategory = asyncHandler(async (req, res) => {
  let { name, description } = req.body;
  const category = await Category.findOne({ name: req.params.category });
  const { subcategory } = req.params;
  if (!category) {
    res.status(404);
    throw new apiError(404, "Category not found");
  }
  if (!name && !description) {
    res.status(400);
    throw new apiError(400, "Fill at least one field to update");
  }
  if (!name) name = subcategory;
  if (description === null)
    description = await Subcategory.findOne({
      name: subcategory,
      category: category._id,
    }).select("description").description;

  console.log(name, description);

  const catid = category._id;
  const sc = await Subcategory.findOneAndUpdate(
    { name: subcategory, category: catid },
    {
      $set: {
        name,
        description,
      },
    },
    {
      new: true,
    }
  );
  if (!sc) {
    res.status(404);
    throw new apiError(404, "Failed to update subcategory");
  }
  res
    .status(200)
    .json(new apiResponse(200, sc, "Subcategory updated successfully"));
});

export const deleteSubcategory = asyncHandler(async (req, res) => {
  const { category, subcategory } = req.params;
  const cat = await Category.findOne({ name: category });
  if (!cat) {
    res.status(404);
    throw new apiError(404, "Category not found");
  }
  const sc = await Subcategory.findOneAndDelete({
    name: subcategory,
    category: cat._id,
  });
  if (!sc) {
    throw new apiError(404, "Failed to delete subcategory");
  }
  res
    .status(200)
    .json(new apiResponse(200, sc, "Subcategory deleted successfully"));
});
