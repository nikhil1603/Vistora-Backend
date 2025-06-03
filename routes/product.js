import express from 'express';
import { isAuth } from '../middlewares/isAuth.js';
import { createProduct, getAllProducts, getSinleProduct, updateProduct, updateProductImage } from '../controller/product.js';
import uploadfiles from '../middlewares/multer.js';

const router = express.Router();

router.post("/product/new", isAuth, uploadfiles, createProduct);
router.get("/product/all", getAllProducts);
router.get("/product/:id", getSinleProduct);
router.put("/product/:id", isAuth, updateProduct);
router.post("/product/:id", isAuth, uploadfiles, updateProductImage);

export default router;
