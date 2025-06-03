import express from "express";
import { isAuth } from "../middlewares/isAuth.js"; 

import  {getAllOrders, getAllOrdersAdmin, getMyOrder, getStats, newOrderCod, newOrderOnline, updateStatus, verifyPayment } from "../controller/Order.js";

const router = express.Router();

router.post("/order/new/cod", isAuth, newOrderCod);

// 🟢 Place all specific routes above the dynamic :id route
router.get("/order/admin/all", isAuth, getAllOrdersAdmin);
router.get("/order/all", isAuth, getAllOrders); // 🟢 move this before /order/:id
router.get("/order/:id", isAuth, getMyOrder); // 🟠 dynamic route, must be last

router.post("/order/:id", isAuth, updateStatus);
router.get("/stats", isAuth, getStats);
router.post("/order/new/online", isAuth, newOrderOnline);
router.post("/order/verify/payment", isAuth, verifyPayment);

export default router;