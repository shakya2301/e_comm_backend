import { User } from "../models/users.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
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

  const user = await User.findOne( {$or: [{ email: email }, { phone: phone }]});
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
  user.save({ validateBeforeSave: false });
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
export const uploadAvatar = asyncHandler(async (req, res) => {

  const avatar = req.file?.path;
  if (!avatar) {
    throw new apiError(400, "No file found");
  }
  const user = User.findById(req.user?.id); //from the auth middleware.

  if (!user) {
    throw new apiError(404, "User not found");
  }

  // Assuming `avatar` is the path to the image file to be uploaded
  const url = await uploadOnCloudinary(avatar);

  // Assuming `userId` is the ID of the user you want to update
  const us = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            pfp: url
        }
    },
    {new: true}
).select("-password -refreshToken")

// Extract the file name with extension



  return res
    .status(200)
    .json(new apiResponse(200, us, "Avatar uploaded successfully"));
});
// pending delete the previous image on cloudinary.



//sends email with the OTP generation, random 6 digit number, stores in encrypted form in cookies.
export const sendEmail = asyncHandler(async (req, res)=> {

    if(req.user?.isVerified) {
        throw new apiError(400, "User is already verified");
    }

    //OTP generation
    const ot = Math.floor(100000 + Math.random() * 900000);
    const otp= ot.toString();

    const useremail = req.user?.email;


    if(!useremail) {
        throw new apiError(400, "No email found");
    }


    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure:false,
        requireTLS:true,
        auth: {
            user: 'ecomm7583@gmail.com',
            pass: 'rxljbhjigpehyiao'
        }
    });
      const mailOptions = {
        from: "ecomm7583@gmail.com",
        to: `${useremail}`,
        subject: "Your verification OTP for the platform.",
        text: `The verification code for your account is ${otp}. PLEASE DO NOT SHARE IT WITH ANYONE.`, 
      }

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
          throw new apiError(500, "Error sending email");
        }
      })
        

      res.status(200)
      .cookie("otp", encryptedOTP, {
        httpOnly: true,
        secure: true,
      })
      .json(new apiResponse(200,"Email sent successfully"))
})

//verifies the OTP, compares the encrypted OTP in cookies with the OTP entered by the user.
export const verifyOtp = asyncHandler(async(req,res)=>{

    if(req.user?.isVerified) 
    {
        throw new apiError(400, "User is already verified");
    }
    const encryptedotp = req.cookies?.otp;
    const {otp} = req.body;
    

    if(!otp) {
        throw new apiError(400, "No OTP found");
    }

    if(!encryptedotp) {
        throw new apiError(400, "No OTP found in cookies");
    }


    const flag= await bcrypt.compare(otp, encryptedotp);
    if(!flag) {
        throw new apiError(401, "Invalid OTP");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                isVerified: true
            }
        },
        {new: true}
    ).select("-password -refreshToken");

    res.status(200)
    .json(new apiResponse(200, user, "User verified successfully"));
})