import {Router} from 'express'
import {authjwt, adminauth} from '../middlewares/auth.middleware.js'
import {createBrand, updateLogo, updateBrand, getAllBrands} from '../controllers/brands.controller.js'
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route('/create').post(authjwt, adminauth,upload.single('logo'),  createBrand);
router.route('/updatelogo/:name').patch(authjwt, adminauth, upload.single('logo'), updateLogo);
router.route('/update/:name').patch(authjwt, adminauth,upload.none(), updateBrand);
router.route('/displayall').get(getAllBrands);

export default router;