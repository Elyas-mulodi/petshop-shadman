import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    productName: { type: String, required: true },
    attributes: [{ name: String, value: String }],
    image: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    province: { type: String, required: true },
    city: { type: String, required: true },
    addressLine: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "سفارش باید حداقل یک آیتم داشته باشد",
      },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },

    subtotal: { type: Number, required: true }, 
    shippingCost: { type: Number, required: true, default: 0 },

    discountAmount: { type: Number, default: 0 },
    discountSource: { type: String, enum: ["coupon", "loyalty", null], default: null },
    couponCode: { type: String, default: null },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },

    totalAmount: { type: Number, required: true }, 

    status: {
      type: String,
      enum: ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "returned"],
      default: "pending_payment",
    },

    payment: {
      authority: { type: String, default: null },
      refId: { type: String, default: null },
      paidAt: { type: Date, default: null },
    },

    stockDeducted: { type: Boolean, default: false }, 
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;