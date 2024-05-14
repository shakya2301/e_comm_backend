import { Seller } from "../models/sellers.model.js";
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

export const registerSeller = asyncHandler(async (req, res) => {
  const { name, email, phone, password, GSTIN, niche, subNiche } = req.body;

  console.log(name, email, phone, password, GSTIN, niche, subNiche);

  if (!name || !email || !phone || !password || !GSTIN || !niche || !subNiche) {
    throw new apiError(400, "Please provide all the necessary details");
  }

  const seller = await Seller.findOne({
    $or: [{ email }, { phone }, { GSTIN }],
  }).exec();

  if (seller) {
    throw new apiError(400, "Seller already exists");
  }

  const newSeller = new Seller({
    name,
    email,
    phone,
    password,
    GSTIN,
    niche: Array(niche),
    subNiche: Array(subNiche),
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

  res
    .status(200)
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
    })
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
    })
    .json(new apiResponse(200, { data }, "Seller logged in successfully"));
});

export const getSellerProfile = asyncHandler(async (req, res) => {
  const seller = req.seller;

  if (!seller) {
    throw new apiError(400, "Seller not found");
  }

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
    to: `${selleremail}`,
    subject: "Your verification OTP for the platform.",
    text: `The verification code for your account is ${otp}. PLEASE DO NOT SHARE IT WITH ANYONE.`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      throw new apiError(500, "Error sending email");
    }
  });
  const encryptedOTP = await bcrypt.hash(otp, 10);
  res
    .status(200)
    .cookie("otp", encryptedOTP, {
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

  const flag = await bcrypt.compare(otp, encryptedotp);
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

  const parts = req.seller.pfp?.split("/");
  const oldAvatarPublicId = parts[parts.length - 1].split(".")[0];

  if (parts) {
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