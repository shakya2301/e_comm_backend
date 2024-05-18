import {Router} from 'express';
import {sellerauth, adminauth, authjwt, sellerverifiedauth, sellerauthorizedauth, verifieduserauth} from '../middlewares/auth.middleware.js';
import {upload} from '../middlewares/multer.middleware.js';
import { createProduct, modifyProduct,deleteProduct, getProducts, getProductsBySearch } from '../controllers/products.controller.js';
import { addProductToCart, removeProductFromCart } from '../controllers/carts.controller.js';
import { writeReview, getReviewsByProductId } from '../controllers/ratings.controller.js';

const router = Router();

router.route('/create').post(sellerauth, sellerverifiedauth, sellerauthorizedauth, upload.array('images', 4), createProduct);
router.route('/modify/:id').patch(sellerauth, sellerverifiedauth, upload.array('images', 4), modifyProduct);
router.route('/delete/:id').delete(sellerauth, sellerverifiedauth, deleteProduct);
router.route('/filter').get(getProducts);
router.route('/search').get(getProductsBySearch);

router.route('/writereview').post(authjwt, verifieduserauth, upload.none(), writeReview);
router.route('/reviews').get(getReviewsByProductId);


//add to cart functionality route

router.route('/addtocart').post(authjwt, addProductToCart);
router.route('/removefromcart').delete(authjwt, removeProductFromCart);


export default router;