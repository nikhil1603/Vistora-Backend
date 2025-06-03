import Cart from "../models/Cart.js";
import TryCatch from "../utils/TryCatch.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import sendOrderConfirmation from "../utils/sendOrderConfirmation.js";
import sendOrderStatusUpdate from "../utils/sendOrderStatusUpdate.js";
import Stripe from 'stripe'

export const newOrderCod = TryCatch(async (req, res) => {
  const { method, phone, address } = req.body;

  const cart = await Cart.find({ user: req.user._id }).populate({
    path: "product",
    select: "title price stock sold",
  });

  if (!cart.length) {
    return res.status(400).json({
      message: "Cart is empty",
    });
  }

  let subTotal = 0;

  const items = cart.map((i) => {
    const itemSubtotal = i.product.price * i.quauntity;
    subTotal += itemSubtotal;

    return {
      product: i.product._id, // added for reference in inventory update
      name: i.product.title,
      price: i.product.price,
      quantity: i.quauntity,
    };
  });

  const order = await Order.create({
    items,
    method,
    phone,
    address,
    user: req.user._id,
    subTotal,
  });

  // Update stock and sold counts
  for (let i of items) {
    const product = await Product.findById(i.product);
    if (product) {
      product.stock -= i.quantity;
      product.sold += i.quantity;
      await product.save();
    }
  }

  // Clear the cart
  await Cart.deleteMany({ user: req.user._id });

  // Send confirmation email
  await sendOrderConfirmation({
    email: req.user.email,
    subject: "Order Confirmation",
    orderId: order._id,
    products: items,
    totalAmount: subTotal,
  });

  res.json({
    message: "Order created successfully",
    order,
  });
});

export const getAllOrders = TryCatch(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

  res.json({ orders });
});


export const getAllOrdersAdmin = TryCatch(async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "You are not authorized to access this resource",
    });
  }

  const orders = await Order.find().populate("user").sort({createdAt: -1});

  res.json( orders );
});

export const getMyOrder = TryCatch(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.product").populate("user");

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  res.json({ order });
});

export const updateStatus = TryCatch(async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "You are not authorized to access this resource",
    });
  }

  // Find and populate order, user, and products in one query
  const order = await Order.findById(req.params.id)
    .populate("user") // to access user.email
    .populate({
      path: "items.product",
      select: "title price",
    });

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  const { status } = req.body;
  order.status = status;
  await order.save();

  if (status === "Shipped" || status === "Delivered") {
    console.log(`Triggering email for status: ${status}`);

    const formattedItems = order.items.map((item) => ({
      name: item.product?.title || "Unknown Product",
      price: item.product?.price || 0,
      quantity: item.quantity,
    }));

    await sendOrderStatusUpdate({
      email: order.user.email,
      subject: `Your order has been ${status}`,
      orderId: order._id,
      products: formattedItems,
      totalAmount: order.subTotal,
      status,
    });
  }

  res.json({
    message: "Order status updated successfully",
    order,
  });
});


export const getStats = TryCatch(async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "You are not authorized to access this resource",
    });
  }

  
  const cod = await Order.find({ method: "cod" }).countDocuments();
  const online = await Order.find({ method: "online" }).countDocuments();
  const products = await Product.find()

  const data = products.map((prod)=>({
    
      name: prod.title,
      sold: prod.sold,
  }));

  res.json({
      cod,
      online,
      data,
  });
});

import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.Stripe_Secret_Key);


export const newOrderOnline = async (req,res) =>{
  try {
    const {method, phone, address} = req.body;

     const cart = await Cart.find({ user: req.user._id }).populate("product");

    if (!cart || cart.length === 0) {
  return res.status(400).json({ message: "Cart is empty" });
}

    const subTotal = cart.reduce(
      (total , item) => total + item.product.price * item.quauntity, 0
    );

    const lineItems = cart.map((item) => ({
     price_data:{
       currency: "inr",
      product_data:{
         name: item.product.title,
         images: [item.product.images[0].url],
      },
      unit_amount: Math.round(item.product.price * 100),
     },
     quantity: item.quauntity,
    }));

    const sesssion = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.Frontend_Url}/ordersuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.Frontend_Url}/cart`,
      metadata: {
        userId: req.user._id.toString(),
        method,
        phone,
        address,
        subTotal,
      },
    });

    res.json({
      url: sesssion.url,
    });
  } catch (error) {
    console.log("Error creating stripe session:", error.message);
    res.status(500).json({
      message: "Failed to create payment session",
    });
  }
};

export const verifyPayment = async (req, res) => {
  const { sessionId } = req.body;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const { userId, method, phone, address, subTotal } = session.metadata;

    const cart = await Cart.find({ user: userId }).populate("product");

    const items = cart.map((i) => {
      return {
        product: i.product._id,
        name: i.product.title,
        price: i.product.price,
        quantity: i.quauntity,
      };
    });

    if (cart.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    const existingOrder = await Order.findOne({ paymentInfo: sessionId });

    if (!existingOrder) {
      const order = await Order.create({
        items: cart.map((item) => ({
          product: item.product._id,
          quantity: item.quauntity,
        })),
        method,
        user: userId,
        phone,
        address,
        subTotal,
        paidAt: new Date(),
        paymentInfo: sessionId,
      });

      for (let i of order.items) {
        const product = await Product.findById(i.product);

        if (product) {
          product.stock -= i.quantity;
          product.sold += i.quantity;

          await product.save();
        }
      }

      await Cart.deleteMany({ user: req.user._id });

      await sendOrderConfirmation({
        email: req.user.email,
        subject: "Order Confirmation",
        orderId: order._id,
        products: items,
        totalAmount: subTotal,
      });

      return res.status(201).json({
        success: true,
        message: "Order created Successfully",
        order,
      });
    }
  } catch (error) {
    console.log("Error verifying payment", error.message);
    res.status(500).json({
      message: error.message,
    });
  }
};