import { Product } from "../models/products.model.js";
import { Category } from "../models/categories.model.js";
import { Subcategory } from "../models/subcategories.model.js";
import { Seller } from "../models/sellers.model.js";
import { Brand } from "../models/brands.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import apiError from "../utils/apiError.js";
import slugify from "slugify";
import mongoose from "mongoose";

//verified seller only
//seller is loggedin. seller id is in req.seller

//not supporting multiple images for now
export const createProduct = asyncHandler(async (req, res) => {
  let { name, description, price, countInStock, category, subCategory, brand } =
    req.body;
  const images = req.files.map((file) => file.path);

  console.log(
    name,
    description,
    price,
    countInStock,
    category,
    subCategory,
    images
  );

  if (
    !name ||
    !description ||
    !price ||
    !countInStock ||
    !category ||
    !subCategory ||
    !images
  ) {
    res.status(400);
    throw new apiError(400, "All fields are required");
  }

  name = slugify(String(name), { lower: true });
  category = slugify(String(category), { lower: true });
  subCategory = slugify(String(subCategory), { lower: true });
  brand = slugify(String(brand), { lower: true });

  if (await Product.findOne({ name: name, seller: req.seller._id })) {
    res.status(400);
    throw new apiError(400, "Product already exists");
  }

  let subCategoryObject = await Subcategory.findOne({ name: subCategory });
  let categoryId = subCategoryObject?.category;
  let subCategoryId = subCategoryObject?._id;

  if (req.seller.niche.includes(categoryId) === false) {
    res.status(401);
    throw new apiError(401, "Unauthorized to create product in this category");
  }

  if (!subCategoryObject) {
    res.status(400);
    throw new apiError(400, "Subcategory not found");
  }

  let sellerId = req.seller._id;
  let brandId;

  if (brand) {
    try {
      brandId = await Brand.findOne({ name: brand });
      brandId = brandId._id;
      console.log(brandId);
    } catch (error) {
      console.log("No brand found");
    }
  } else {
    brandId = null;
  }

  console.log(brandId);

  if (!sellerId) {
    res.status(400);
    throw new apiError(400, "Seller not found, please login again");
  }

  const urls = await Promise.all(images.map(uploadOnCloudinary));

  const newProduct = await Product.create({
    name,
    description,
    price,
    countInStock,
    category: categoryId,
    subCategory: subCategoryId,
    seller: sellerId,
    brand: brandId,
    images: urls,
  });

  const data = await newProduct.save();

  if (!data) {
    res.status(500);
    throw new apiError(500, "Error creating product");
  }

  res
    .status(200)
    .json(new apiResponse(200, data, "Product created successfully"));
});

//may not cover some edge cases
export const modifyProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  if (!productId) {
    res.status(400);
    throw new apiError(400, "Product ID is required");
  }
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new apiError(404, "Product not found");
  }
  if (String(product.seller) !== String(req.seller._id)) {
    res.status(401);
    throw new apiError(401, "Unauthorized to modify product");
  }
  let { name, description, price, countInStock, category, subCategory, brand } =
    req.body;
  let newImages = req.files?.map((file) => file.path);
  if (
    !name &&
    !description &&
    !price &&
    !countInStock &&
    !category &&
    !subCategory &&
    !brand &&
    !newImages
  ) {
    res.status(400);
    throw new apiError(400, "No fields to update");
  }
  subCategory =
    (await Subcategory.findOne({ name: slugify(subCategory) })._id) || null;
  category = (await Category.findOne({ name: slugify(category) })._id) || null;
  brand = (await Brand.findOne({ name: slugify(brand) })._id) || null;
  newImages =
    newImages && newImages.length > 0
      ? await Promise.all(
          newImages.map(async (image) => await uploadOnCloudinary(image))
        )
      : null;
  name = name || product.name;
  description = description || product.description;
  price = price || product.price;
  countInStock = countInStock || product.countInStock;
  category = category || product.category;
  subCategory = subCategory || product.subCategory;
  brand = brand || product.brand;
  newImages = newImages || product.images;
  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      $set: {
        name,
        description,
        price,
        countInStock,
        category,
        subCategory,
        brand,
        images: newImages,
      },
    },
    {
      new: true,
    }
  );
  if (!updatedProduct) {
    res.status(500);
    throw new apiError(500, "Error updating product");
  }
  res
    .status(200)
    .json(new apiResponse(200, updatedProduct, "Product updated successfully"));
});
//works fine
export const deleteProduct = asyncHandler(async (req, res) => {
    const productId = req.params.id;
    if (!productId) {
      res.status(400);
      throw new apiError(400, "Product ID is required");
    }
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new apiError(404, "Product not found");
    }
    if (String(product.seller) !== String(req.seller._id)) {
      res.status(401);
      throw new apiError(401, "Unauthorized to delete product");
    }
    if (product.images && product.images.length > 0) {
      const deleteImages = await Promise.all(
        product.images.map(async (image) => {
          const parts = image.split("/");
          const publicId = parts[parts.length - 1].split(".")[0];
          return await deleteFromCloudinary(publicId);
        })
      );
      if (!deleteImages.every((result) => result)) {
        throw new apiError(500, "Error in deleting product images");
      }
    }
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      res.status(500);
      throw new apiError(500, "Error deleting product");
    }
    res
      .status(200)
      .json(new apiResponse(200, deletedProduct, "Product deleted successfully"));
  });
  //works but some reconsideration needed.
//this is the filter functionality.
export const getProducts = asyncHandler(async (req, res) => {
  let { category, subcategory, brand, seller, minPrice, maxPrice } = req.query;
  console.log(category, subcategory, brand, seller, minPrice, maxPrice);

  // Initialize the match object with an empty condition
  let matchCondition = {};

  // Use regex for case-insensitive matching and partial matches
  // Set an impossible condition if the entity does not exist
  if (category) {
    const categoryObj = await Category.findOne({
      name: new RegExp(slugify(category), "i"),
    });
    matchCondition.category = categoryObj ? categoryObj._id : null;
  }
  if (subcategory) {
    const subcategoryObj = await Subcategory.findOne({
      name: new RegExp(slugify(subcategory), "i"),
    });
    matchCondition.subCategory = subcategoryObj ? subcategoryObj._id : null;
  }
  if (brand) {
    const brandObj = await Brand.findOne({
      name: new RegExp(slugify(brand), "i"),
    });
    matchCondition.brand = brandObj ? brandObj._id : null;
  }
  if (seller) {
    const sellerObj = await Seller.findOne({ name: new RegExp(seller, "i") });
    matchCondition.seller = sellerObj ? sellerObj._id : null;
  }

  // Adding price range condition
  if (minPrice || maxPrice) {
    matchCondition.price = {};
    if (minPrice) {
      matchCondition.price.$gte = parseFloat(minPrice);
    }
    if (maxPrice) {
      matchCondition.price.$lte = parseFloat(maxPrice);
    }
  }

  // Check if any of the conditions are set to null, indicating a non-existent entity
  if (
    matchCondition.category === null ||
    matchCondition.subCategory === null ||
    matchCondition.brand === null ||
    matchCondition.seller === null
  ) {
    return res.status(404).json({ message: "No products found" });
  }

  // Define the aggregation pipeline with the dynamic match condition
  let pipeline = [
    {
      $match: matchCondition,
    },
    // Add other stages as needed, for example, to populate references
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    {
      $unwind: "$categoryDetails",
    },
    {
      $lookup: {
        from: "subcategories",
        localField: "subCategory",
        foreignField: "_id",
        as: "subCategoryDetails",
      },
    },
    {
      $unwind: "$subCategoryDetails",
    },
    {
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brandDetails",
      },
    },
    {
      $unwind: "$brandDetails",
    },
    {
      $lookup: {
        from: "sellers",
        localField: "seller",
        foreignField: "_id",
        as: "sellerDetails",
      },
    },
    {
      $unwind: "$sellerDetails",
    },
    // Optionally, add a project stage to format the output
    {
      $project: {
        name: 1,
        description: 1,
        price: 1,
        countInStock: 1,
        images: 1,
        category: "$categoryDetails.name",
        subCategory: "$subCategoryDetails.name",
        brand: "$brandDetails.name",
        seller: "$sellerDetails.name",
        ratings: 1,
      },
    },
  ];

  // Execute the aggregation pipeline
  const products = await Product.aggregate(pipeline);

  // Check if products were found
  if (!products || products.length === 0) {
    return res.status(404).json({ message: "No products found" });
  }

  // Respond with the found products
  res.status(200).json(new apiResponse(200, products, "All products"));
});

// working :) amazingly
export const getProductsBySearch = asyncHandler(async (req, res) => {
  const { query = "", page = 1 } = req.query; // Note: 'page' is no longer used since pagination is removed

  // Removed options related to pagination

  // First, fetch all categories, subcategories, brands, and sellers that match the query
  const categories = await Category.find({ name: new RegExp(query, "i") }).select("_id");
  const subcategories = await Subcategory.find({ name: new RegExp(query, "i") }).select("_id");
  const brands = await Brand.find({ name: new RegExp(query, "i") }).select("_id");
  const sellers = await Seller.find({ name: new RegExp(query, "i") }).select("_id");

  // Convert fetched documents into arrays of IDs
  const categoryIds = categories.map(cat => cat._id);
  const subcategoryIds = subcategories.map(sub => sub._id);
  const brandIds = brands.map(brand => brand._id);
  const sellerIds = sellers.map(seller => seller._id);

  // Construct the match condition to search across multiple fields
  const matchCondition = {
      $or: [
          { description: { $regex: query, $options: "i" } },
          { name: { $regex: query, $options: "i" } },
          { brand: { $in: brandIds } },
          { category: { $in: categoryIds } },
          { subCategory: { $in: subcategoryIds } },
          { seller: { $in: sellerIds } },
      ],
  };

  const aggregateQuery = [
      { $match: matchCondition },
      {
          $lookup: {
              from: "brands",
              localField: "brand",
              foreignField: "_id",
              as: "brand",
          },
      },
      {
          $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "category",
          },
      },
      {
          $lookup: {
              from: "subcategories",
              localField: "subCategory",
              foreignField: "_id",
              as: "subCategory",
          },
      },
      {
          $lookup: {
              from: "sellers",
              localField: "seller",
              foreignField: "_id",
              as: "seller",
          },
      },
      {
          $project: {
              name: 1,
              description: 1,
              price: 1,
              countInStock: 1,
              images: 1,
              ratings: 1,
              brand: { $arrayElemAt: ["$brand.name", 0] },
              category: { $arrayElemAt: ["$category.name", 0] },
              subCategory: { $arrayElemAt: ["$subCategory.name", 0] },
              seller: { $arrayElemAt: ["$seller.name", 0] },
          },
      },
  ];

  const result = await Product.aggregate(aggregateQuery); // Directly using aggregate without pagination

  if (!result || result.length === 0) {
      throw new apiError(404, "No products found");
  }

  // Manually formatting the response to mimic the structure provided by aggregatePaginate
  const formattedResult = {
      docs: result,
      totalDocs: result.length,
      limit: result.length, // Since there's no pagination, limit can be set to the length of the result
      totalPages: 1,
      page: 1,
      pagingCounter: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
  };

  res.status(200).json(new apiResponse(200, formattedResult, "Products found"));
});


export const getProductById = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  if (!productId) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  const pipeline = [
    {
      $match: { _id: new mongoose.Types.ObjectId(productId) }
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryDetails"
      }
    },
    {
      $unwind: "$categoryDetails"
    },
    {
      $lookup: {
        from: "subcategories",
        localField: "subCategory",
        foreignField: "_id",
        as: "subCategoryDetails"
      }
    },
    {
      $unwind: "$subCategoryDetails"
    },
    {
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brandDetails"
      }
    },
    {
      $unwind: "$brandDetails"
    },
    {
      $lookup: {
        from: "sellers",
        localField: "seller",
        foreignField: "_id",
        as: "sellerDetails"
      }
    },
    {
      $unwind: "$sellerDetails"
    },
    {
      $project: {
        name: 1,
        description: 1,
        price: 1,
        countInStock: 1,
        images: 1,
        category: "$categoryDetails.name",
        subCategory: "$subCategoryDetails.name",
        brand: "$brandDetails.name",
        seller: "$sellerDetails.name",
        ratings: 1,
      }
    }
  ];

  const productDetails = await Product.aggregate(pipeline);

  if (!productDetails || productDetails.length === 0) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.status(200).json({ status: 200, data: productDetails[0], message: "Product found" });
});