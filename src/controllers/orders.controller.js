import { Order } from "../models/orders.model.js";
import { Orderitem } from "../models/orderItems.model.js";
import { Product } from "../models/products.model.js";
import { Cartproduct } from "../models/cartproducts.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { instance } from "../utils/rzr.util.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../models/users.model.js";
import { Useraddress } from "../models/useraddress.model.js";
import { pipeline } from "stream";

dotenv.config({
    path: "./.env",
})

export const createOrder = asyncHandler(async (req, res) => {
  let { amount, reciept } = req.body;
  amount = Number(amount) * 100;

  try {
    // const razorpay_instance = new Razorpay({
    //   key_id: `rzp_test_3tqqyWsje3FdOs`,
    //   key_secret: `kAlusZkM8NKw8IehMRsIwzAb`,
    // });

    // let options = Object({
    //   amount: 5000,
    //   currency: "INR",
    //   reciept: "reciept",
    // });

    // const order =razorpay_instance.orders.create(options, function (err, order) {
    //   console.log(order);
    //   res
    //     .status(200)
    //     .json(new apiResponse(200, order, "Order created successfully"));
    // });
    

    var options = {
      amount: amount, // amount in the smallest currency unit
      currency: "INR",
      receipt: reciept,
    };
    console.log(instance);
    instance.orders.create(options, function (err, order) {
      console.log(order);
      res.status(200)
      .json(
        new apiResponse(200, order, "Order created successfully")
      )
    });
  } catch (error) {
    console.log(error);
    throw new apiError(400, "Order creation failed");
  }
});

export const validateOrder = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  console.log(body.toString());
  console.log(process.env.RZP_SECRET);

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RZP_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (!isAuthentic) {
    console.log("Payment Failed");
    throw new apiError(400, "Invalid Signature || Payment Failed");
  }


  res
    .status(200)
    .json(
      new apiResponse(
        200,
        {},
        "Payment verified successfully"
      )
    );
});

export const orderSuccess = asyncHandler(async (req, res) => {
  let { orderId, paymentId, amount, addressId, cartId } = req.body;
  // let status = 'processing'
//   console.log(req.user._id,addressId,  "order success body")
  let addressID= new mongoose.Types.ObjectId(addressId);
  let userid = await Object(User.findById(req.user._id))
  let address = await Object(Useraddress.findById(addressID));

//   console.log(addressID, "address id")

  if(!userid) {
    throw new apiError(404, "User not found");
  }

  if(!address) {
    throw new apiError(404, "Address not found");
  }
  

//   console.log(req.body, userid , "order success body");

    const cartItems = await Cartproduct.find({ cart: cartId });

    if(!cartItems) {
      throw new apiError(404, "Cart is empty");
    }
    const prevorder = await Order.findOne({ orderId})
    if(prevorder) {
        console.log(Order.findOne({ orderId}));
      throw new apiError(400, "Order already exists");
    }
    
    var order = await Order.create({
        user: userid,
        totalAmount: amount,
        status: 'pending',
        address: addressID,
        paymentId: paymentId,
        orderId: orderId
    })

    let orderid = order._id;
    console.log(orderid);
    console.log(order);

    if(!order) {
        throw new apiError(400, "Order creation failed");
    }

    cartItems.map(async(item)=> {
        let orderId = orderid
        let user = userid
        let product = item.product
        let quantity = item.quantity
        let status = 'pending'

        const orderItem = await Orderitem.create({
            orderId,
            user,
            product,
            quantity,
            status
        })
    })

    
    // console.log(cartItems);

    res.status(200).json(new apiResponse(200, order, "Order placed successfully"));
});

export const orderFailed = asyncHandler(async (req, res) => {
  res.status(200).json(new apiResponse(200, null, "Payment failed"));
});


export const getOrdersByUser = asyncHandler(async (req, res) => {
  const userid = req.user._id;

  const pipeline = [
    {
      $match: {
        user: new mongoose.Types.ObjectId(userid),
      },
    },
    {
      $lookup: {
        from: "orderitems",
        localField: "_id",
        foreignField: "orderId",
        as: "orderItems",
      },
    },
    {
      $unwind: {
        path: "$orderItems",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "orderItems.product",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $unwind: {
        path: "$productDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        orderItems: {
          $push: {
            product: "$productDetails",
            quantity: "$orderItems.quantity",
            price: { $multiply: ["$orderItems.quantity", "$productDetails.price"] },
          },
        },
        user: { $first: "$user" },
        address: { $first: "$address" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        totalAmount: { $sum: { $multiply: ["$orderItems.quantity", "$productDetails.price"] } },
      },
    },
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "_id",
        as: "orderDetails",
      },
    },
    {
      $unwind: {
        path: "$orderDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        "user.password": 0,
        "user.createdAt": 0,
        "user.updatedAt": 0,
        "user.__v": 0,
        "address.createdAt": 0,
        "address.updatedAt": 0,
        "address.__v": 0,
        "orderItems.product.__v": 0,
        "orderItems.product.createdAt": 0,
        "orderItems.product.updatedAt": 0,
      },
    },
  ];

  try {
    const orders = await Order.aggregate(pipeline);
    if (!orders || orders.length === 0) {
      throw new apiError(404, "No orders found");
    }
    res.status(200).json(new apiResponse(200, orders, "Orders retrieved successfully"));
  } catch (error) {
    console.error(error);
    throw new apiError(400, "Error fetching orders");
  }
});

export const cancelOrderByUser = asyncHandler(async (req, res) => {
  let { orderId } = req.body;
  const userId = req.user._id;

  // orderId = new mongoose.Types.ObjectId(orderId);

  const order = await Order.findById(orderId);
  if (!order) {
    throw new apiError(404, "Order not found");
  }

  if (order.user.toString() !== userId.toString()) {
    throw new apiError(403, "You do not have permission to cancel this order");
  }

  if (order.status !== 'pending') {
    throw new apiError(400, "Only pending orders can be cancelled");
  }

  try {
    await order.updateOne({ status: "cancelled" });
  } catch (error) {
    console.error(error);
    throw new apiError(400, "Error cancelling order");
  }

  res.status(200).json(new apiResponse(200, {}, "Order cancelled successfully"));
});

export const repeatOrder = asyncHandler(async (req, res) => {
  let {orderId} = req.params;
  const userId = req.user._id;

  const order = await Order.findOne({orderId: orderId});
  const orderItems = await Orderitem.find({ orderId: order._id });

  //new orderID generation

  try {
    var options = {
      amount: amount, // amount in the smallest currency unit
      currency: "INR",
      receipt: reciept,
    };
    console.log(instance);
    instance.orders.create(options, function (err, order) {
      console.log(order);
      res.status(200)
      .json(
        new apiResponse(200, order, "Order created successfully")
      )
    });
  } catch (error) {
    console.log(error);
    throw new apiError(400, "Order creation failed");
  }
})