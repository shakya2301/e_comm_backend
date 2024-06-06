import express from "express";
import {
    registerSeller,
    loginSeller,
    getSellerProfile,
    logoutSeller,
    updateSellerProfile,
    updateSellerPfp,
    sendEmail,
    verifyOtp,
    changePassword,
    forgotPassword,
    resetPassword,
    deleteSeller,
    getProductsBySeller
} from "../controllers/sellers.controller.js";
import { sellerauth } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.route('/register').post(registerSeller);
router.route('/login').post(upload.none(), loginSeller);
router.route('/profile').get(sellerauth, getSellerProfile);
router.route('/logout').post(sellerauth, logoutSeller);
router.route('/update').patch(sellerauth, upload.none(), updateSellerProfile);
router.route('/update/pfp').patch(sellerauth, upload.single('pfp'), updateSellerPfp);
router.route('/sendmail').post(sellerauth, sendEmail);
router.route('/verifyotp').post(sellerauth, upload.none(), verifyOtp);
router.route('/changepassword').post(sellerauth, upload.none(), changePassword);
router.route('/forgotpassword').post(upload.none(), forgotPassword);
router.route('/resetpassword/:token').get(upload.none(), resetPassword);
router.route('/delete').delete(sellerauth, deleteSeller,logoutSeller);

router.route('/products').post(sellerauth, getProductsBySeller);

export default router;
