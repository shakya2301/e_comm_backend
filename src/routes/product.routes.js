import {Router} from 'express';
import {sellerauth, adminauth, authjwt, sellerverifiedauth, sellerauthorizedauth} from '../middlewares/auth.middleware.js';
import {upload} from '../middlewares/multer.middleware.js';
import { createProduct, modifyProduct,deleteProduct, getProducts, getProductsBySearch } from '../controllers/products.controller.js';

const router = Router();

router.route('/create').post(sellerauth, sellerverifiedauth, sellerauthorizedauth, upload.array('images', 4), createProduct);
router.route('/modify/:id').patch(sellerauth, sellerverifiedauth, upload.array('images', 4), modifyProduct);
router.route('/delete/:id').delete(sellerauth, sellerverifiedauth, deleteProduct);
router.route('/filter').get(getProducts);
router.route('/search').get(getProductsBySearch);
export default router;