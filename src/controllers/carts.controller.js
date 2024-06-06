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

  if (!quantity || isNaN(quantity) || quantity <= 0) {
    throw new apiError(400, "Quantity is required and must be a number greater than 0");
  }

  const product = await Product.findById(productId).populate('seller', 'name'); // Assuming 'seller' is a reference in the Product model
  if (!product) {
    throw new apiError(404, "Product not found");
  }

  if (product.countInStock < quantity) {
    throw new apiError(400, "Product out of stock, please retry");
  }

  if (!req.usercart) {
    return next(new apiError("Cart not found, please verify yourself", 404));
  }

  const cartId = req.usercart?._id;
  if (req.usercart.isBlocked) {
    return next(new apiError("Cart is blocked, please verify yourself", 403));
  }

  let cartProduct = await Cartproduct.findOne({
    cart: cartId,
    product: productId,
  });

  let newCartProduct;
  if (cartProduct) {
    cartProduct.quantity = quantity;
    newCartProduct = await cartProduct.save();
  } else {
    newCartProduct = await Cartproduct.create({
      cart: cartId,
      product: productId,
      quantity,
    });
  }

  // Construct the response object with product details and cart information
  const response = {
    productId: product._id,
    productName: product.name,
    productPrice: product.price,
    seller: product.seller.name, // Assuming the seller's name is what's needed
    cartId: cartId,
    quantity: newCartProduct.quantity,
  };

  res.status(200).json(new apiResponse(200, response, "Product added to cart successfully"));
});


export const getCart = asyncHandler(async (req, res, next) => {
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
        as: "productInfo",
      },
    },
    {
      $unwind: "$productInfo",
    },
    {
      $project: {
        _id: 0,
        cartId: "$cart",
        productId: "$productInfo._id",
        productName: "$productInfo.name",
        productPrice: "$productInfo.price",
        seller: "$productInfo.seller",
        images : "$productInfo.images",
        quantity: 1,
      },
    },
  ];
  const cartProducts = await Cartproduct.aggregate(pipeline);
  // if (!cartProducts || cartProducts.length === 0) {
  //   return res.status(404).json(new apiError(404, "Cart is empty"));
  // }
  // Since the original addProductToCart controller returns a single product addition, 
  // for consistency, we might need to adjust the logic to return a similar structure for each product in the cart.
  // However, this example will return all products in the cart matching the requested structure.
  res.status(200).json(new apiResponse(200, { cartId: cartid, products: cartProducts }, "Cart fetched successfully"));
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

export const clearCart = asyncHandler(async (req, res) => {
    const cartid = req.usercart?._id;
    
    if (!cartid) {
        throw (new apiError(400, "Cart not found, please verify yourself"));
    }
    
    const cartproducts = await Cartproduct.deleteMany({
        cart: cartid,
    });
    
    res
        .status(200)
        .json(
        new apiResponse(200, cartproducts, "Cart cleared successfully")
        );
})

//pending to remove the records from the cartproduct collection when the user is deleted...