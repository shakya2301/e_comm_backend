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
  resetPassword,
  makeAdmin
} from "../controllers/users.controller.js";
import { getCart, clearCart } from "../controllers/carts.controller.js";
import { getReviewsByUser, deleteReview } from "../controllers/ratings.controller.js";
import { createUserAddress, getUserAddresses, deleteUserAddress } from "../controllers/useraddress.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { authjwt, adminauth, verifieduserauth } from "../middlewares/auth.middleware.js";
import {createOrder, validateOrder, orderSuccess, getOrdersByUser, cancelOrderByUser } from "../controllers/orders.controller.js";

const router = express.Router();

router.route("/register").post(upload.none(), registerUser); //user registered successfully, requires the necessary data and the avatar compulsorily.
router.route("/login").post(upload.none(), loginUser);

// secured routes:

router.route("/logout").post(authjwt, logoutUser);
router.route("/refresh").post(authjwt, refreshAccessToken);
router.route("/changeavatar").post(authjwt, upload.single("avatar"), uploadAvatar);
router.route("/sendmail").post(authjwt, sendEmail);
router.route("/verifyotp").post(authjwt, upload.none(), verifyOtp);
router.route("/changepassword").post(authjwt, upload.none(), changePassword);
router.route("/delete").delete(authjwt, deleteUser, logoutUser);
router.route("/display").post(authjwt, displayUser);
router.route("/modify").post(authjwt,upload.none(), modifyUser);

//forgot password routes;

router.route("/forgotpassword").post(upload.none(), forgotPassword);
router.route("/resetpassword/:token").get(upload.none(), resetPassword);

//admin routes(special powers);

router.route("/makeadmin").post(authjwt, adminauth,upload.none(), makeAdmin);

//cart view 

router.route('/cart').get(authjwt, getCart);
router.route('/clearcart').post(authjwt, clearCart);

//reviews and ratings routes

router.route('/reviews').get(authjwt, getReviewsByUser);
router.route('/deletereview').delete(authjwt, verifieduserauth, deleteReview)

//address routes

router.route('/address/add').post(authjwt, verifieduserauth, upload.none(), createUserAddress);
router.route('/address/display').post(authjwt, getUserAddresses);
router.route('/address/delete').post(authjwt, verifieduserauth, deleteUserAddress);


//order routes

router.route('/order/create').post(authjwt, createOrder);
router.route('/order/validate').post(validateOrder);
router.route('/order/success').post(authjwt, orderSuccess);
// router.route('/order/fail').post(authjwt, orderFail);
router.route('/order/display').get(authjwt, getOrdersByUser);
router.route('/order/cancel').post(authjwt, cancelOrderByUser);


export default router;
