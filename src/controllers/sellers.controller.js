import { Seller } from "../models/sellers.model.js";
import { Category } from "../models/categories.model.js";
import { Subcategory } from "../models/subcategories.model.js";
import { Product } from "../models/products.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import apiError from "../utils/apiError.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { sendMail } from "../utils/mailservice.js";
import slugify from "slugify";
import { Schema } from "mongoose";

export const registerSeller = asyncHandler(async (req, res) => {
  let { name, email, phone, password, GSTIN, niche } = req.body;
  console.log(name, email, phone, password, GSTIN, niche);
  if (!name || !email || !phone || !password || !GSTIN || !niche ) {
    throw new apiError(400, "Please provide all the necessary details");
  }
  const seller = await Seller.findOne({
    $or: [{ email }, { phone }, { GSTIN }],
  }).exec();
  if (seller) {
    throw new apiError(400, "Seller already exists");
  }
  niche = niche.split(" ");
  if (niche.length === 0) {
    throw new apiError(400, "Please provide at least one niche");
  }

  console.log(niche);


  const nicheIds = await Promise.all(
    niche.map(async (n) => {
      const category = await Category.findOne({ name: slugify(n) }).exec();
      return category ? (category._id) : null;
    })
  );
  console.log((nicheIds));
  const newSeller = new Seller({
    name,
    email,
    phone,
    password,
    GSTIN,
    niche: (nicheIds),
  });
  const data = await newSeller.save();
  return res
    .status(200)
    .json(new apiResponse(200, data, "Seller registered successfully"));
});



export const loginSeller = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;

  console.log(email, phone, password);

  if (!email && !phone) {
    throw new apiError(400, "Please provide email or phone number");
  }
  if (!password) {
    throw new apiError(400, "Please provide password");
  }

  const seller = await Seller.findOne({ $or: [{ email }, { phone }] }).exec();

  if (!seller) {
    throw new apiError(400, "Seller does not exist");
  }

  const isMatch = await bcrypt.compare(password, seller.password);
  if (!isMatch) {
    throw new apiError(400, "Invalid credentials");
  }

  const refreshToken = jwt.sign(
    { id: seller._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  const accessToken = jwt.sign(
    {
      id: seller._id,
      name: seller.name,
      email: seller.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );

  const data = await Seller.findByIdAndUpdate(
    seller._id,
    { refreshToken },
    { new: true }
  ).exec();

  const pipeline = [
    {
      $match: {
        _id: seller._id,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "niche",
        foreignField: "_id",
        as: "niche",
      },
    },
    {
      $unwind: "$niche",
    },
    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        email: { $first: "$email" },
        phone: { $first: "$phone" },
        GSTIN: { $first: "$GSTIN" },
        pfp: { $first: "$pfp" },
        isVerified: { $first: "$isVerified" },
        isAuthorized: { $first: "$isAuthorized" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        niche: { $push: "$niche.name" },
      },
    },
    {
      $project: {
        _id: 0,
        name: 1,
        email: 1,
        phone: 1,
        GSTIN: 1,
        niche: 1,
        pfp: 1,
        isVerified: 1,
        isAuthorized: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]

  const sellerData = await Seller.aggregate(pipeline);

  res
    .status(200)
    .cookie("refreshToken", refreshToken, {
      httpOnly: false,
      secure: false,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .cookie("accessToken", accessToken, {
      httpOnly: false,
      secure: false,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    .json(new apiResponse(200, sellerData, "Seller logged in successfully"));
});

export const getSellerProfile = asyncHandler(async (req, res) => {
  const sellerid = req.seller._id;

  const pipeline = [
    {
      $match: {
        _id: sellerid,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "niche",
        foreignField: "_id",
        as: "niche",
      },
    },
    {
      $unwind: "$niche",
    },
    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        email: { $first: "$email" },
        phone: { $first: "$phone" },
        GSTIN: { $first: "$GSTIN" },
        pfp: { $first: "$pfp" },
        isVerified: { $first: "$isVerified" },
        isAuthorized: { $first: "$isAuthorized" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        niche: { $push: "$niche.name" },
      },
    },
    {
      $project: {
        _id: 0,
        name: 1,
        email: 1,
        phone: 1,
        GSTIN: 1,
        niche: 1,
        pfp: 1,
        isVerified: 1,
        isAuthorized: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];
  

  const seller = await Seller.aggregate(pipeline);

  res
    .status(200)
    .json(new apiResponse(200, seller, "Seller profile fetched successfully"));
});

export const logoutSeller = asyncHandler(async (req, res) => {
  //clear the cookies
  //remove the refreshToken in DB
  const sellerid = req.seller._id;
  if (!sellerid) {
    throw new apiError(400, "Seller not found");
  }
  const data = await Seller.findByIdAndUpdate(
    sellerid,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  if (!data) {
    throw new apiError(400, "Seller not found in DB");
  }

  res
    .status(200)
    .clearCookie("refreshToken")
    .clearCookie("accessToken")
    .json(new apiResponse(200, null, "Seller logged out successfully"));
});

export const updateSellerProfile = asyncHandler(async (req, res) => {
  const seller = req.seller;
  const { name, email, phone, GSTIN } = req.body;

  if (!seller) {
    throw new apiError(400, "Seller not found");
  }
  const flag = Boolean(email || phone || GSTIN);

  const data = await Seller.findByIdAndUpdate(
    seller._id,
    {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(GSTIN && { GSTIN }),
      isVerified: flag ? false : seller.isVerified,
      isAuthorized: flag ? false : seller.isAuthorized,
    },
    {
      new: true,
    }
  )
    .select("-password -refreshToken")
    .exec();

  res
    .status(200)
    .json(new apiResponse(200, data, "Seller profile updated successfully"));
});

export const updateSellerPfp = asyncHandler(async (req, res) => {
  const seller = req.seller;
  const localFilePath = req.file?.path;

  if (!seller) {
    throw new apiError(400, "Seller not found");
  }

  if (!localFilePath) {
    throw new apiError(400, "Please provide a profile picture");
  }

  const parts = req.seller.pfp?.split("/");
  const oldAvatarPublicId = parts[parts.length - 1].split(".")[0];

  if (parts) {
    const deleteOldAvatar = await deleteFromCloudinary(oldAvatarPublicId);
    if (!deleteOldAvatar) {
      throw new apiError(500, "Error in deleting old avatar");
    }
  }
  const pfp = await uploadOnCloudinary(localFilePath);

  if (!pfp) {
    throw new apiError(500, "Error uploading profile picture");
  }

  const data = await Seller.findByIdAndUpdate(
    seller._id,
    {
      $set: {
        pfp: pfp,
      },
    },
    {
      new: true,
    }
  )
    .select("-password -refreshToken")
    .exec();

  res
    .status(200)
    .json(
      new apiResponse(200, data, "Seller profile picture updated successfully")
    );
});
//pending delete from cloudinary

export const sendEmail = asyncHandler(async (req, res) => {
  if (req.seller?.isVerified) {
    throw new apiError(400, "Seller is already verified");
  }

  //OTP generation
  const ot = Math.floor(100000 + Math.random() * 900000);
  const otp = ot.toString();

  const selleremail = req.seller?.email;

  if (!selleremail) {
    throw new apiError(400, "No email found");
  }

  sendMail(selleremail, otp);

  const encryptedOTP = jwt.sign(
    {
      otp:otp,
    },
    `${process.env.TOKEN_SECRET}`,
    {
      expiresIn: "5m",
    }
  );

  res
    .status(200)
    .cookie("otp", String(encryptedOTP), {
      httpOnly: true,
      secure: true,
    })
    .json(new apiResponse(200, "Email sent successfully"));
});

export const verifyOtp = asyncHandler(async (req, res) => {
  if (req.seller?.isVerified) {
    throw new apiError(400, "Seller is already verified");
  }
  const encryptedotp = req.cookies?.otp;
  const { otp } = req.body;

  if (!otp) {
    throw new apiError(400, "No OTP found");
  }

  if (!encryptedotp) {
    throw new apiError(400, "No OTP found in cookies");
  }

  const flag = Object(jwt.verify(encryptedotp, `${process.env.TOKEN_SECRET}`)).otp === otp;
  if (!flag) {
    throw new apiError(401, "Invalid OTP");
  }

  const seller = await Seller.findByIdAndUpdate(
    req.seller?._id,
    {
      $set: {
        isVerified: true,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new apiResponse(200, seller, "Seller verified successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword } = req.body;

  if (!oldpassword || !newpassword) {
    throw new apiError(400, "Please provide old and new password");
  }

  if (oldpassword === newpassword) {
    throw new apiError(400, "Old and new password cannot be same");
  }

  const seller = await Seller.findById(req.seller?._id);

  if (!seller) {
    throw new apiError(404, "Seller not found");
  }

  const match = await seller.matchPasswords(oldpassword);
  if (!match) {
    throw new apiError(401, "Invalid credentials");
  }

  const encryptednewpassword = await bcrypt.hash(newpassword, 10);
  const newseller = await Seller.findByIdAndUpdate(
    req.seller?._id,
    {
      $set: {
        password: encryptednewpassword,
      },
    },
    { new: true }
  ).select("-refreshToken");

  res
    .status(200)
    .json(new apiResponse(200, newseller, "Password changed successfully"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log(email);
  if (!email) {
    throw new apiError(400, "Please provide email");
  }
  const seller = await Seller.findOne({ email });
  if (!seller) {
    throw new apiError(404, "Seller not found");
  }
  const sellerid = seller._id;
  const token = jwt.sign(
    {
      id: sellerid,
    },
    `${process.env.TOKEN_SECRET}`,
    {
      expiresIn: "1h",
    }
  );

  const link = `http://localhost:8000/api/seller/resetpassword/${token}`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: "ecomm7583@gmail.com",
      pass: "rxljbhjigpehyiao",
    },
  });

  const mailOptions = {
    from: "ecomm7583@gmail.com",
    to: `${email}`,
    subject: "Password reset link",
    text: "Greetings from the platform. Please click on the link below to reset your password.",
    html: `<a href="${link}">Reset Password</a>`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      throw new apiError(500, error.message, "Error sending email");
    }
  });
  res.status(200).json(new apiResponse(200, "Email sent successfully"));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  console.log(token, password);
  if (!token || !password) {
    throw new apiError(400, "Please provide token and password");
  }
  const decodedToken = jwt.verify(token, `${process.env.TOKEN_SECRET}`);
  if (!decodedToken) {
    throw new apiError(401, "Invalid token");
  }
  const seller = await Seller.findById(decodedToken.id);
  if (!seller) {
    throw new apiError(404, "Seller not found");
  }
  const encryptedpassword = await bcrypt.hash(password, 10);
  const newseller = await Seller.findByIdAndUpdate(
    decodedToken.id,
    {
      $set: {
        password: encryptedpassword,
      },
    },
    { new: true }
  ).select("-refreshToken");

  res
    .status(200)
    .json(new apiResponse(200, newseller, "Password changed successfully"));
});

export const deleteSeller = asyncHandler(async (req, res) => {
  //deleting the user from the database.
  //deleting the browser cookies.
  //logging the user out.
  //deleting the user's avatar from cloudinary.
  const seller = await Seller.findByIdAndDelete(req.seller?._id);
  if (!seller) {
    throw new apiError(404, "Seller not found");
  }

  const products = await Product.find({ seller: req.seller?._id }).exec();

  const parts = req.seller.pfp?.split("/");
  

  if (parts) {
    const oldAvatarPublicId = parts[parts.length - 1].split(".")[0];
    const deleteOldAvatar = await deleteFromCloudinary(oldAvatarPublicId);
    if (!deleteOldAvatar) {
      throw new apiError(500, "Error in deleting old avatar");
    }
  }

  res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .clearCookie("otp")
    .json(new apiResponse(200, seller, "Seller deleted successfully"));
});

export const getProductsBySeller = asyncHandler(async (req, res) => {
  const sellerId = req.seller._id;
  // Assuming 'category', 'subCategory', and 'brand' are the correct field names in your Product model
  const products = await Product.find({ seller: sellerId })
    .populate('category', 'name') // Populates the category field, fetching only the name
    .populate('brand', 'name') // Populates the brand field, fetching only the name
    .populate('subCategory', 'name') // Populates the subCategory field, fetching only the name
    .exec();

  if (!products || products.length === 0) {
    return res.status(404).json(new apiResponse(404, {}, "No products found for this seller"));
  }

  res.status(200).json(new apiResponse(200, products, "Products fetched successfully"));
});
