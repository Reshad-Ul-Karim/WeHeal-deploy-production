import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "./db/connectDB.js";
import Order from "./models/orderModel.js";
import Cart from "./models/cartModel.js";
import Product from "./models/productModel.js";

dotenv.config();

async function testOrderCreation() {
  try {
    await connectDB();
    
    console.log("Checking products...");
    const products = await Product.find({}).limit(5);
    console.log(`Found ${products.length} products`);
    
    console.log("Checking carts...");
    const carts = await Cart.find({}).populate('items.productId');
    console.log(`Found ${carts.length} carts`);
    
    if (carts.length > 0) {
      console.log("Cart contents:", JSON.stringify(carts[0], null, 2));
    }
    
    console.log("Checking orders...");
    const orders = await Order.find({}).limit(5);
    console.log(`Found ${orders.length} orders`);
    
    // Test creating a simple order
    console.log("Testing order creation...");
    const testOrder = new Order({
      userId: "6894858243e922cdc6efb282",
      items: [{
        productId: products[0]?._id,
        name: "Test Product",
        category: "medicine",
        quantity: 1,
        price: 10,
        total: 10
      }],
      totalAmount: 10,
      shippingAddress: {
        street: "123 Test St",
        city: "Test City",
        state: "Test State",
        zipCode: "12345",
        country: "Test Country"
      }
    });
    
    await testOrder.save();
    console.log("Test order created successfully:", testOrder.orderId);
    
    // Delete the test order
    await Order.findByIdAndDelete(testOrder._id);
    console.log("Test order deleted");
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testOrderCreation();
