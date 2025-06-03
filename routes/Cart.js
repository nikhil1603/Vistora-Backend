import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { addToCart, fetchCart, removeFromCart, updateCart } from "../controller/Cart.js";

const router = express.Router();

router.post("/Cart/add", isAuth, addToCart);
router.get("/Cart/remove/:id", isAuth, removeFromCart);
router.post("/Cart/update", isAuth, updateCart);
router.get("/Cart/all", isAuth, fetchCart);

export default router;