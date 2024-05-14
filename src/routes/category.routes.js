import express, { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryDetails,
  updateCategory,
  deleteCategory,
} from "../controllers/categories.controller.js";

import { createSubcategory, getAllSubcategories, getAllSubcategoriesByCategory, updateSubcategory, deleteSubcategory } from "../controllers/subcategories.controller.js";

import { authjwt, adminauth } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/create").post(authjwt, adminauth, upload.none(), createCategory);
router.route("/displayall").get(getAllCategories);
router.route("/display/:name").get(getCategoryDetails);
router
  .route("/update/:name")
  .patch(authjwt, adminauth, upload.none(), updateCategory);
router.route("/delete/:name").delete(authjwt, adminauth, deleteCategory);



//subcategory routes
router.route("/:category/create").post(authjwt, adminauth, upload.none(), createSubcategory);
router.route("/displayallsubcategories").get(getAllSubcategories);
router.route("/:category/displayall").get(getAllSubcategoriesByCategory)
router.route("/:category/update/:subcategory").patch(authjwt, adminauth, upload.none(), updateSubcategory);
router.route("/:category/delete/:subcategory").delete(authjwt, adminauth, deleteSubcategory);

export default router;
