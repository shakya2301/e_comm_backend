import { Cart } from "../models/carts.model.js";
import { Cartproduct } from "../models/cartproducts.model.js";
import { Product } from "../models/products.model.js";
import { User } from "../models/users.model.js";
import apiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";

//controller used in the product router file...

export const addProductToCart = asyncHandler(async (req, res) => {
  let { productId, quantity } = req.query;
  const userId = req.user.id;

  if (!productId) {
    throw new apiError(400, "Product ID is required");
  }

  if(!quantity || isNaN(quantity) || quantity <= 0) {
    throw new apiError(400, "Quantity is required and must be a number greater than 0");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new apiError(404, "Product not found");
  }

  if (product.countInStock < quantity) {
    throw new apiError(400, "Product out of stock, please retry");
  }

  if (!req.usercart) {
    return next(new apiError("Cart not found, please verify yourself", 404));
  }
  const cartid = req.usercart?._id;

  if (req.usercart.isBlocked) {
    return next(new apiError("Cart is blocked, please verify yourself", 403));
  }

  let cartproduct = await Cartproduct.findOne({
    cart: cartid,
    product: productId,
  });

  let newCartProduct;

  if (cartproduct) {
    cartproduct.quantity = quantity;
    newCartProduct = await cartproduct.save();
  } else { 
      newCartProduct = await Cartproduct.create({
        cart: cartid,
        product: productId,
        quantity,
      });
  }

  res
    .status(200)
    .json(
      new apiResponse(200, newCartProduct, "Product added to cart successfully")
    );
});

export const getCart = asyncHandler(async (req, res) => {
  const cartid = req.usercart?._id;

  if (!cartid) {
    return next(new apiError("Cart not found, please verify yourself", 404));
  }

  if (req.usercart.isBlocked) {
    return next(new apiError("Cart is blocked, please verify yourself", 403));
  }

  const pipeline = [
    {
      $match: {
        cart: cartid,
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: "$quantity" },
        products: { $push: "$product" },
      },
    },
    {
      $project: {
        _id: 0,
        totalQuantity: 1,
        products: 1,
      },
    },
  ];

  const cart = await Cartproduct.aggregate(pipeline);

  if (!cart || cart.length === 0) {
    throw (new apiError(404, "Cart is empty"));
  }

  res
    .status(200)
    .json(new apiResponse(200, cart[0], "Cart fetched successfully"));
});

export const removeProductFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.query;
    const cartid = req.usercart?._id;
    
    if (!productId) {
        throw (new apiError(400, "Product ID is required"));
    }
    
    if (!cartid) {
        throw (new apiError(400, "Cart not found, please verify yourself"));
    }
    
    const cartproduct = await Cartproduct.findOneAndDelete({
        cart: cartid,
        product: productId,
    });
    
    if (!cartproduct) {
        throw (new apiError(400, "Product not found in cart"));
    }
    
    res
        .status(200)
        .json(
        new apiResponse(200, cartproduct, "Product removed from cart successfully")
        );
})

//pending to remove the records from the cartproduct collection when the user is deleted...