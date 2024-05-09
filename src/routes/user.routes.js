import express from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken} from "../controllers/users.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {authjwt} from "../middlewares/auth.middleware.js";

const router = express.Router();


router.route("/register").post(upload.single('avatar'), registerUser); //user registered successfully, requires the necessary data and the avatar compulsorily.
router.route("/login").post(upload.none(), loginUser);

// //secured routes:

router.route("/logout").post(authjwt, logoutUser);
router.route("/refresh").post(refreshAccessToken);

export default router;
