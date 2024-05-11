import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  uploadAvatar,
  sendEmail,
  verifyOtp,
  changePassword,
  deleteUser,
  displayUser,
  modifyUser,
  forgotPassword,
  resetPassword
} from "../controllers/users.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authjwt } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/register").post(upload.none(), registerUser); //user registered successfully, requires the necessary data and the avatar compulsorily.
router.route("/login").post(upload.none(), loginUser);

// secured routes:

router.route("/logout").post(authjwt, logoutUser);
router.route("/refresh").post(refreshAccessToken);
router.route("/changeavatar").post(authjwt, upload.single("avatar"), uploadAvatar);
router.route("/sendmail").post(authjwt, sendEmail);
router.route("/verifyotp").post(authjwt, upload.none(), verifyOtp);
router.route("/changepassword").post(authjwt, upload.none(), changePassword);
router.route("/delete").delete(authjwt, deleteUser, logoutUser);
router.route("/display").get(authjwt, displayUser);
router.route("/modify").post(authjwt,upload.none(), modifyUser);

//forgot password routes;

router.route("/forgotpassword").post(upload.none(), forgotPassword);
router.route("/resetpassword/:token").get(upload.none(), resetPassword);

export default router;
