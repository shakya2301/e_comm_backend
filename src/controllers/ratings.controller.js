import { User } from "../models/users.model.js";
import { Rating } from "../models/ratings.model.js";
import { Product } from "../models/products.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

//handles both the creation of a new review and the modification of an existing review effectively.
export const writeReview = asyncHandler(async (req, res) => {
  let { rating, review, isAnonymous } = req.body;
  let { productId } = req.query;

  if (!rating || rating < 0 || rating > 5) {
    throw new apiError(
      400,
      "Rating is required and valid values only between 0 and 5"
    );
  }

  const user = req.user;
  const product = await Product.findById(productId);

  if (!product) {
    throw new apiError(404, "Product not found");
  }

  let existingRating = await Rating.findOne({
    user: user._id,
    product: product._id,
  });

  if (existingRating) {
    existingRating.rating = rating;
    existingRating.review = review;
    existingRating.isAnonymous = isAnonymous || false;
    existingRating = await existingRating.save();
  } else {
    const ratingObj = new Rating({
      rating,
      review,
      isAnonymous: isAnonymous || false,
      user: user._id,
      product: product._id,
    });
    existingRating = await ratingObj.save();
  }

  const pipeline = [
    {
      $match: {
        product: product._id,
      },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
      },
    },
    {
      $project: {
        _id: 0,
        avgRating: 1,
      },
    },
  ];

  const avgRating = await Rating.aggregate(pipeline);
  const updatedProductRating = await Product.findByIdAndUpdate(
    product._id,
    { ratings: avgRating[0].avgRating },
    { new: true }
  );

  res.json(
    new apiResponse(
      200,
      { rating: existingRating, product: updatedProductRating },
      "Review added successfully"
    )
  );
});

export const getReviewsByProductId = asyncHandler(async (req, res) => {
  const { productId } = req.query;
  const product = await Product.findById(productId);

  if (!product) {
    throw new apiError(404, "Product not found");
  }

  const reviews = await Rating.find({ product: productId })
    .populate("product")
    .populate("user");

  if (!reviews) {
    throw new apiError(404, "No reviews found for this product");
  }

  const formattedReviews = reviews.map((review) => {
    const reviewerName = review.isAnonymous ? "Anonymous" : review.user.name;
    return {
      _id: review._id,
      rating: review.rating,
      review: review.review,
      isAnonymous: review.isAnonymous,
      reviewerName: reviewerName,
    };
  });

  res.json(
    new apiResponse(200, formattedReviews, "Reviews fetched successfully")
  );
});

export const getReviewsByUser = asyncHandler(async (req, res) => {
  const user = req.user;
  const reviews = await Rating.find({ user: user._id })
    .populate("product")
    .populate("user");

  if (!reviews) {
    throw new apiError(404, "No reviews found for this user");
  }

  const formattedReviews = reviews.map((review) => {
    return {
      _id: review._id,
      rating: review.rating,
      review: review.review,
      isAnonymous: review.isAnonymous,
      product: review.product,
    };
  });

  res.json(
    new apiResponse(200, formattedReviews, "Reviews fetched successfully")
  );
});

export const deleteReview = asyncHandler(async (req, res) => 
{
    const { reviewId } = req.query;
    const review = await Rating.findById(reviewId);
    
    if (!review) {
        throw new apiError(404, "Review not found");
    }
    
    if (review.user.toString() !== req.user._id.toString()) {
        throw new apiError(403, "Unauthorized to delete this review");
    }
    
    const deletedreview = await Rating.findByIdAndDelete(reviewId);
    
    res.json(new apiResponse(200, deletedreview , "Review deleted successfully"));
})