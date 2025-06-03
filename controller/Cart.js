import TryCatch from "../utils/TryCatch.js";
import Cart from "../models/Cart.js";
import  Product  from "../models/Product.js";

export const addToCart = TryCatch(async (req, res) => {
  const { product, quauntity } = req.body;

  const cart = await Cart.findOne({
    product: product,
    user: req.user._id,
  }).populate("product");

  if (cart) {
    if (cart.product.stock === cart.quauntity)
      return res.status(400).json({
        message: "Out of Stock",
      });

    cart.quantity = cart.quauntity + 1;

    await cart.save();

    return res.json({
      message: "Added to cart",
    });
  }

  const cartProd = await Product.findById(product);

  if (cartProd.stock === 0)
    return res.status(400).json({
      message: "Out of Stock",
    });

  await Cart.create({
    quauntity: 1,
    product: product,
    user: req.user._id,
  });

  res.json({
    message: "Added to cart",
  });
});


export const removeFromCart = TryCatch(async (req, res) => {
  const cart = await Cart.findById(req.params.id);

  if (!cart) {
    return res.status(404).json({
      message: "Cart item not found",
    });
  }

  await cart.deleteOne();

  res.json({
    message: "Removed from cart",
  });
});

export const updateCart = TryCatch(async (req, res) => {
  const { action } = req.query;
  const { id } = req.body;

  const cart = await Cart.findById(id).populate("product");

  if (!cart) {
    return res.status(404).json({
      message: "Cart item not found",
    });
  }

  if (action === "inc") {
    if (cart.quauntity < cart.product.stock) {
      cart.quauntity++;
      await cart.save();
    } else {
      return res.status(400).json({
        message: "Out of stock",
      });
    }

    return res.json({
      message: "Cart updated",
    });
  }

  if (action === "dec") {
    if (cart.quauntity > 1) {
      cart.quauntity--;
      await cart.save();
    } else {
      return res.status(400).json({
        message: "You have only one item",
      });
    }

    return res.json({
      message: "Cart updated",
    });
  }

  return res.status(400).json({
    message: "Invalid action",
  });
});


export const fetchCart = TryCatch(async (req, res) => {
    const cart = await Cart.find({ user: req.user._id }).populate("product");

    const sumofQuantity = cart.reduce(
       (total, item) => total + item.quauntity, 
       0

    );

    let subTotal = 0

    cart.forEach((i)=>{
       const itemsubTotal = i.product.price * i.quauntity;
        subTotal += itemsubTotal;
    });

    res.json({
        cart,
        sumofQuantity,
        subTotal
    });
});