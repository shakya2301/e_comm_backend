import { User } from "../models/users.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import apiError from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  // const avatar = req.file?.path;
  if (!name || !email || !password || !phone) {
    throw new apiError(400, "Please provide all the necessary details");
  }
  const userExists = await User.findOne({
    $or: [{ email: email }, { phone: phone }],
  });

  if (userExists) {
    throw new apiError(400, "User already exists");
  }

  // const url = await uploadOnCloudinary(avatar);

  // if(!url){
  //     throw new apiError(500,"Error uploading image to cloudinary")
  // }

  const user = new User({
    name,
    email,
    password,
    phone,
  });
  await user.save();
  res
    .status(201)
    .json(new apiResponse(201, user, "User registered successfully"));
});

//updated: login with email or phone.
export const loginUser = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;
  if ((!email && !phone) || !password) {
    throw new apiError(400, "Please provide email/phone and password");
  }

  const user = await User.findOne({
    $or: [{ email: email }, { phone: phone }],
  });
  if (!user) {
    throw new apiError(404, "User not found");
  }
  const match = await user.matchPasswords(password);
  if (!match) {
    throw new apiError(401, "Invalid credentials");
  }

  const accessToken = jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    `${process.env.ACCESS_TOKEN_SECRET}`,
    {
      expiresIn: "1d",
    }
  );

  const refreshToken = jwt.sign(
    {
      id: user._id,
    },
    `${process.env.REFRESH_TOKEN_SECRET}`,
    {
      expiresIn: "7d",
    }
  );

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  const userdata = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
    })
    .json(
      new apiResponse(200, {
        userdata,
        accessToken,
        refreshToken,
      })
    );
});

//works
export const logoutUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new apiError(401, "Unauthorized access");
  }
  await User.findByIdAndUpdate(
    req.user.id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );
  // curruser.save({validateBeforeSave:false});

  res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .clearCookie("otp")
    .json(new apiResponse(200, "User logged out successfully"));
});

//works
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken =
    req.cookies?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!incomingToken) {
    throw new apiError(401, "No token found, please login");
  }

  const decodedToken = jwt.verify(
    incomingToken,
    `${process.env.REFRESH_TOKEN_SECRET}`
  );
  if (!decodedToken) {
    throw new apiError(401, "Invalid token");
  }

  const user = await User.findById(decodedToken.id).select("-password");
  if (!user) {
    throw new apiError(404, "User not found, invalid token");
  }
  if (user.refreshToken !== incomingToken) {
    throw new apiError(401, "Refresh Token changed, login again");
  }

  const newaccessToken = jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    `${process.env.ACCESS_TOKEN_SECRET}`,
    {
      expiresIn: "1d",
    }
  );

  const newrefreshToken = jwt.sign(
    {
      id: user._id,
    },
    `${process.env.REFRESH_TOKEN_SECRET}`,
    {
      expiresIn: "7d",
    }
  );

  user.refreshToken = newrefreshToken;
  user.save({ validateBeforeSave: false });

  res
    .status(200)
    .cookie("accessToken", newaccessToken, {
      httpOnly: true,
      secure: true,
    })
    .cookie("refreshToken", newrefreshToken, {
      httpOnly: true,
      secure: true,
    })
    .json(
      new apiResponse(
        200,
        {
          newaccessToken,
          newrefreshToken,
        },
        "Token refreshed successfully"
      )
    );
});

//upload avatar is a secured route operation.
// pending delete the previous image on cloudinary: done
export const uploadAvatar = asyncHandler(async (req, res) => {
  const avatar = req.file?.path;
  console.log(avatar);
  if (!avatar) {
    throw new apiError(400, "No file found");
  }
  const user = User.findById(req.user?.id); //from the auth middleware.
  
  if (!user) {
    throw new apiError(404, "User not found");
  }
  

  // delete the previous image from cloudinary...

  const parts = req.user.pfp?.split("/");
  const oldAvatarPublicId = parts[parts.length - 1].split(".")[0];

  if (parts) {
    const deleteOldAvatar = await deleteFromCloudinary(oldAvatarPublicId);
    if (!deleteOldAvatar) {
      throw new apiError(500, "Error in deleting old avatar");
    }
  }

  // Assuming `avatar` is the path to the image file to be uploaded
  const url = await uploadOnCloudinary(avatar);

  // Assuming `userId` is the ID of the user you want to update
  const us = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        pfp: url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  // Extract the file name with extension

  return res
    .status(200)
    .json(new apiResponse(200, us, "Avatar uploaded successfully"));
});

//sends email with the OTP generation, random 6 digit number, stores in encrypted form in cookies.
export const sendEmail = asyncHandler(async (req, res) => {
  if (req.user?.isVerified) {
    throw new apiError(400, "User is already verified");
  }

  //OTP generation
  const ot = Math.floor(100000 + Math.random() * 900000);
  const otp = ot.toString();

  const useremail = req.user?.email;

  if (!useremail) {
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
    to: `${useremail}`,
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

//verifies the OTP, compares the encrypted OTP in cookies with the OTP entered by the user.
export const verifyOtp = asyncHandler(async (req, res) => {
  if (req.user?.isVerified) {
    throw new apiError(400, "User is already verified");
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

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        isVerified: true,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new apiResponse(200, user, "User verified successfully"));
});

//change password, knowing the old password.
export const changePassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword } = req.body;

  if (!oldpassword || !newpassword) {
    throw new apiError(400, "Please provide old and new password");
  }

  if (oldpassword === newpassword) {
    throw new apiError(400, "Old and new password cannot be same");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new apiError(404, "User not found");
  }

  const match = await user.matchPasswords(oldpassword);
  if (!match) {
    throw new apiError(401, "Invalid credentials");
  }

  const encryptednewpassword = await bcrypt.hash(newpassword, 10);
  const newuser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        password: encryptednewpassword,
      },
    },
    { new: true }
  ).select("-refreshToken");

  res
    .status(200)
    .json(new apiResponse(200, newuser, "Password changed successfully"));
});

//forgot password: 1. Send email with the link to the page with the token.
//sends mail with the link to the page with the token.
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new apiError(400, "Please provide email");
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new apiError(404, "User not found");
  }
  const userid = user._id;
  const token = jwt.sign(
    {
      id: userid,
    },
    `${process.env.TOKEN_SECRET}`,
    {
      expiresIn: "1h",
    }
  );

  const link = `http://localhost:8000/api/user/resetpassword/${token}`;

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

//the function to actually reset the password once you reach the page.
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
  const user = await User.findById(decodedToken.id);
  if (!user) {
    throw new apiError(404, "User not found");
  }
  const encryptedpassword = await bcrypt.hash(password, 10);
  const newuser = await User.findByIdAndUpdate(
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
    .json(new apiResponse(200, newuser, "Password changed successfully"));
});

//works
export const deleteUser = asyncHandler(async (req, res) => {
  //deleting the user from the database.
  //deleting the browser cookies.
  //logging the user out.
  //deleting the user's avatar from cloudinary.
  const user = await User.findByIdAndDelete(req.user?._id);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  if(user.pfp){
    const parts = user.pfp?.split("/");
    const oldAvatarPublicId = parts[parts.length - 1].split(".")[0];
    if (parts) {
      const deleteOldAvatar = await deleteFromCloudinary(oldAvatarPublicId);
      if (!deleteOldAvatar) {
        throw new apiError(500, "Error in deleting old avatar");
      }
    }
  }
  res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .clearCookie("otp")
    .json(new apiResponse(200, user, "User deleted successfully"));
});

//works
export const displayUser = asyncHandler(async (req, res) => {
  const result = req?.user;
  if (!result) {
    throw new apiError(404, "No user found");
  }
  res.status(200).json(new apiResponse(200, result, "User found successfully"));
});

export const modifyUser = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  console.log(name, email, phone);
  if (!name && !email && !phone) {
    throw new apiError(400, "Please fill atleast one field to update");
  }

  const flag = email === undefined;
  console.log(flag);

  const newname = name || req.user?.name;
  const newemail = email || req.user?.email;
  const newphone = phone || req.user?.phone;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        name: newname,
        email: newemail,
        phone: newphone,
        isVerified: flag,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  res.status(200).json(new apiResponse(200, user, "User updated successfully"));
});
